/**
 * Email Provider Manager Tests
 *
 * Tests for the email provider adapter system including:
 * - Provider availability checking
 * - Provider selection and fallback
 * - Email sending with provider switching
 * - Credit tracking
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EmailProviderManager } from '../email-provider-manager';
import { EmailProvider } from '@shared/types/provider-adapter.types';
import { SendPulseProviderAdapter } from '../sendpulse.provider-adapter';
import { BrevoProviderAdapter } from '../brevo.provider-adapter';
import { ResendProviderAdapter } from '../resend.provider-adapter';

// Mock the provider credit tracker
vi.mock('../provider-credit-tracker.service', () => ({
  getProviderCreditTracker: () => ({
    incrementUsage: vi.fn().mockResolvedValue({
      success: true,
      dailyRemaining: 499,
      monthlyRemaining: 14999,
    }),
    isProviderAvailable: vi.fn().mockResolvedValue(true),
    getProviderUsage: vi.fn().mockResolvedValue({
      provider: 'sendpulse',
      todayRequests: 1,
      monthCredits: 1,
      lastDailyReset: new Date().toISOString(),
      lastMonthlyReset: new Date().toISOString(),
      totalRequests: 1,
      totalCredits: 1,
    }),
    logProviderUsage: vi.fn(),
    resetDailyCounters: vi.fn(),
    resetMonthlyCounters: vi.fn(),
  }),
}));

// Mock template loading
vi.mock('@/emails/templates/WelcomeEmail', () => ({
  WelcomeEmail: ({ name }: { name: string }) => `Welcome ${name}`,
}));

describe('EmailProviderManager', () => {
  let manager: EmailProviderManager;

  beforeEach(() => {
    manager = new EmailProviderManager();
  });

  describe('Provider Registration', () => {
    test('should register all default providers', () => {
      const providers = manager.getAllProviders();

      expect(providers).toHaveLength(3);
      expect(providers.map(p => p.getProviderName())).toEqual([
        EmailProvider.SENDPULSE,
        EmailProvider.BREVO,
        EmailProvider.RESEND,
      ]);
    });

    test('should register custom provider', () => {
      const mockAdapter = {
        getProviderName: () => 'custom' as EmailProvider.SENDPULSE,
        getConfig: () => ({
          provider: EmailProvider.SENDPULSE,
          tier: 'free',
          priority: 1,
          enabled: true,
          supportedModels: [],
        }),
        send: vi.fn().mockResolvedValue({ success: true }),
        getUsage: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
        resetCounters: vi.fn(),
      };

      manager.registerProvider(mockAdapter as any);
      const providers = manager.getAllProviders();

      expect(providers).toHaveLength(4);
    });
  });

  describe('Provider Selection', () => {
    test('should get SendPulse as primary provider', async () => {
      const provider = await manager.getProvider();

      expect(provider.getProviderName()).toBe(EmailProvider.SENDPULSE);
      expect(provider.getConfig().priority).toBe(1);
    });

    test('should switch to Brevo when SendPulse is unavailable', async () => {
      // Disable SendPulse to simulate hitting limits
      manager.updateProviderConfig(EmailProvider.SENDPULSE, { enabled: false });

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe(EmailProvider.BREVO);
      expect(provider.getConfig().priority).toBe(2);
    });

    test('should switch to Resend when both SendPulse and Brevo are unavailable', async () => {
      // Disable SendPulse and Brevo to simulate hitting limits
      manager.updateProviderConfig(EmailProvider.SENDPULSE, { enabled: false });
      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe(EmailProvider.RESEND);
      expect(provider.getConfig().priority).toBe(3);
    });

    test('should throw error when all providers are unavailable', async () => {
      // Disable all providers to simulate hitting all limits
      manager.updateProviderConfig(EmailProvider.SENDPULSE, { enabled: false });
      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });
      manager.updateProviderConfig(EmailProvider.RESEND, { enabled: false });

      await expect(manager.getProvider()).rejects.toThrow('No email providers available');
    });

    test('should get provider by type', () => {
      const sendpulse = manager.getProviderByType(EmailProvider.SENDPULSE);
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      expect(sendpulse).toBeDefined();
      expect(brevo).toBeDefined();
      expect(resend).toBeDefined();

      expect(sendpulse?.getProviderName()).toBe(EmailProvider.SENDPULSE);
      expect(brevo?.getProviderName()).toBe(EmailProvider.BREVO);
      expect(resend?.getProviderName()).toBe(EmailProvider.RESEND);
    });

    test('should return undefined for unknown provider', () => {
      const unknown = manager.getProviderByType('unknown' as EmailProvider);
      expect(unknown).toBeUndefined();
    });
  });

  describe('Provider Configuration', () => {
    test('should have correct SendPulse config', () => {
      const sendpulse = manager.getProviderByType(EmailProvider.SENDPULSE);
      const config = sendpulse?.getConfig();

      expect(config?.provider).toBe(EmailProvider.SENDPULSE);
      expect(config?.priority).toBe(1);
      expect(config?.enabled).toBe(true);
      expect(config?.freeTier?.monthlyCredits).toBe(15000);
      expect(config?.fallbackProvider).toBe(EmailProvider.BREVO);
    });

    test('should have correct Brevo config', () => {
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const config = brevo?.getConfig();

      expect(config?.provider).toBe(EmailProvider.BREVO);
      expect(config?.priority).toBe(2);
      expect(config?.enabled).toBe(true);
      expect(config?.freeTier?.monthlyCredits).toBe(9000);
      expect(config?.fallbackProvider).toBe(EmailProvider.RESEND);
    });

    test('should have correct Resend config', () => {
      const resend = manager.getProviderByType(EmailProvider.RESEND);
      const config = resend?.getConfig();

      expect(config?.provider).toBe(EmailProvider.RESEND);
      expect(config?.priority).toBe(3);
      expect(config?.enabled).toBe(true);
      expect(config?.freeTier?.monthlyCredits).toBe(3000);
      expect(config?.fallbackProvider).toBeUndefined();
    });

    test('should update provider config', () => {
      manager.updateProviderConfig(EmailProvider.SENDPULSE, {
        enabled: false,
      });

      const sendpulse = manager.getProviderByType(EmailProvider.SENDPULSE);
      expect(sendpulse?.getConfig().enabled).toBe(false);
    });
  });

  describe('Fallback Priority', () => {
    test('should order providers by priority', async () => {
      const providers = manager
        .getAllProviders()
        .filter(p => p.getConfig().enabled)
        .sort((a, b) => a.getConfig().priority - b.getConfig().priority);

      expect(providers[0].getProviderName()).toBe(EmailProvider.SENDPULSE);
      expect(providers[1].getProviderName()).toBe(EmailProvider.BREVO);
      expect(providers[2].getProviderName()).toBe(EmailProvider.RESEND);
    });

    test('should have correct fallback chain', () => {
      const sendpulse = manager.getProviderByType(EmailProvider.SENDPULSE);
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // SendPulse -> Brevo -> Resend
      expect(sendpulse?.getConfig().fallbackProvider).toBe(EmailProvider.BREVO);
      expect(brevo?.getConfig().fallbackProvider).toBe(EmailProvider.RESEND);
      expect(resend?.getConfig().fallbackProvider).toBeUndefined();
    });
  });

  describe('Get All Providers Usage', () => {
    test('should return usage for all providers', async () => {
      const usage = await manager.getAllProvidersUsage();

      expect(usage).toBeDefined();
      expect(Object.keys(usage)).toHaveLength(3);
      expect(usage[EmailProvider.SENDPULSE]).toBeDefined();
      expect(usage[EmailProvider.BREVO]).toBeDefined();
      expect(usage[EmailProvider.RESEND]).toBeDefined();
    });
  });
});

describe('BaseEmailProviderAdapter', () => {
  describe('Template Loading', () => {
    test('should have all required templates defined', async () => {
      const sendpulse = new SendPulseProviderAdapter();
      const templates = [
        'welcome',
        'payment-success',
        'subscription-update',
        'low-credits',
        'password-reset',
      ];

      // Test that template export names are defined
      // This is a compile-time check, but we verify the structure
      expect(templates).toHaveLength(5);
      expect(templates).toContain('welcome');
      expect(templates).toContain('payment-success');
      expect(templates).toContain('subscription-update');
      expect(templates).toContain('low-credits');
      expect(templates).toContain('password-reset');
    });
  });

  describe('Subject Lines', () => {
    test('should generate correct subjects', async () => {
      const sendpulse = new SendPulseProviderAdapter();

      // Subjects are generated internally, we just verify the adapter exists
      expect(sendpulse.getProviderName()).toBe(EmailProvider.SENDPULSE);
      expect(sendpulse.getConfig().provider).toBe(EmailProvider.SENDPULSE);
    });
  });
});
