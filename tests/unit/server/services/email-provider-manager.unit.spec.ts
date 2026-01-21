/**
 * Unit tests for Email Provider Manager
 *
 * Tests the provider selection, failover logic, and configuration management
 * for multiple email providers.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailProvider } from '@shared/types/provider-adapter.types';
import type {
  IEmailProviderAdapter,
  IEmailProviderConfig,
  ISendEmailParams,
  ISendEmailResult,
  IEmailProviderUsage,
} from '@shared/types/provider-adapter.types';

// Mock environment variables before importing the module
let mockServerEnv = {
  BREVO_API_KEY: 'test-brevo-key',
  RESEND_API_KEY: 'test-resend-key',
  EMAIL_FROM_ADDRESS: 'test@example.com',
  BASE_URL: 'https://example.com',
  SUPPORT_EMAIL: 'support@example.com',
  APP_NAME: 'TestApp',
  ENV: 'test',
  ALLOW_TRANSACTIONAL_EMAILS_IN_DEV: 'false',
};

vi.mock('@shared/config/env', () => ({
  serverEnv: new Proxy({} as Record<string, string>, {
    get(_, prop) {
      return mockServerEnv[prop as keyof typeof mockServerEnv];
    },
  }),
  isTest: vi.fn(() => true),
  isDevelopment: vi.fn(() => false),
}));

// Mock provider adapters
const mockBrevoConfig: IEmailProviderConfig = {
  provider: EmailProvider.BREVO,
  tier: 'hybrid' as const,
  priority: 1,
  enabled: true,
  freeTier: {
    dailyRequests: 300,
    monthlyCredits: 9000,
    hardLimit: true,
    resetTimezone: 'UTC',
  },
  fallbackProvider: EmailProvider.RESEND,
};

const mockResendConfig: IEmailProviderConfig = {
  provider: EmailProvider.RESEND,
  tier: 'hybrid' as const,
  priority: 3,
  enabled: true,
  freeTier: {
    dailyRequests: 100,
    monthlyCredits: 3000,
    hardLimit: true,
    resetTimezone: 'UTC',
  },
};

// Create mock adapter factory
const createMockAdapter = (
  name: EmailProvider,
  config: IEmailProviderConfig,
  isAvailableValue: boolean = true,
  sendResult: ISendEmailResult = { success: true, messageId: 'test-id', provider: name }
): IEmailProviderAdapter => {
  // Create a mutable config object
  const mutableConfig = JSON.parse(JSON.stringify(config));

  const adapter = {
    getProviderName: () => name,
    getConfig: () => mutableConfig, // Return reference to allow updates to be visible
    isAvailable: vi.fn(async () => isAvailableValue),
    send: vi.fn(async () => sendResult),
    getUsage: vi.fn(async () => ({
      provider: name,
      todayRequests: 10,
      monthCredits: 100,
      lastDailyReset: new Date().toISOString(),
      lastMonthlyReset: new Date().toISOString(),
      totalRequests: 1000,
      totalCredits: 10000,
    })),
    resetCounters: vi.fn(async () => undefined),
  };

  // Add config property for updateProviderConfig to access (same reference)
  (adapter as unknown as { config: IEmailProviderConfig }).config = mutableConfig;

  return adapter;
};

// Mock the provider adapters before importing
vi.mock('@server/services/email-providers/brevo.provider-adapter', () => ({
  createBrevoAdapter: () =>
    createMockAdapter(EmailProvider.BREVO, mockBrevoConfig, true, {
      success: true,
      messageId: 'brevo-id',
      provider: EmailProvider.BREVO,
    }),
}));

vi.mock('@server/services/email-providers/resend.provider-adapter', () => ({
  createResendAdapter: () =>
    createMockAdapter(EmailProvider.RESEND, mockResendConfig, true, {
      success: true,
      messageId: 'resend-id',
      provider: EmailProvider.RESEND,
    }),
}));

describe('EmailProviderManager', () => {
  let EmailProviderManager: (typeof import('@server/services/email-providers/email-provider-manager'))['EmailProviderManager'];
  let getEmailProviderManager: (typeof import('@server/services/email-providers/email-provider-manager'))['getEmailProviderManager'];
  let resetEmailProviderManager: (typeof import('@server/services/email-providers/email-provider-manager'))['resetEmailProviderManager'];

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the singleton before each test
    const { resetEmailProviderManager: reset } =
      await import('@server/services/email-providers/email-provider-manager');
    reset();

    // Import the module after mocks are set up
    const module = await import('@server/services/email-providers/email-provider-manager');
    EmailProviderManager = module.EmailProviderManager;
    getEmailProviderManager = module.getEmailProviderManager;
    resetEmailProviderManager = module.resetEmailProviderManager;

    // Clear singleton again after import
    resetEmailProviderManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create instance with default providers registered', async () => {
      const manager = new EmailProviderManager();
      const providers = manager.getAllProviders();

      expect(providers).toHaveLength(2);
      expect(providers.map(p => p.getProviderName())).toEqual([
        EmailProvider.BREVO,
        EmailProvider.RESEND,
      ]);
    });

    test('should register providers with correct priority', async () => {
      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      expect(brevo?.getConfig().priority).toBe(1);
      expect(resend?.getConfig().priority).toBe(3);
    });

    test('should have all providers enabled by default', async () => {
      const manager = new EmailProviderManager();
      const providers = manager.getAllProviders();

      providers.forEach(provider => {
        expect(provider.getConfig().enabled).toBe(true);
      });
    });
  });

  describe('getProvider', () => {
    test('should return highest priority available provider', async () => {
      const manager = new EmailProviderManager();
      const provider = await manager.getProvider();

      expect(provider.getProviderName()).toBe(EmailProvider.BREVO);
    });

    test('should skip unavailable providers and return next available', async () => {
      const manager = new EmailProviderManager();

      // Mock brevo as unavailable
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      if (brevo) {
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(false);
      }

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe(EmailProvider.RESEND);
    });

    test('should throw error when no providers are available', async () => {
      const manager = new EmailProviderManager();

      // Mock both providers as unavailable
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      if (brevo) {
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(false);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(false);
      }

      await expect(manager.getProvider()).rejects.toThrow(
        'No email providers available. All providers have hit their free tier limits.'
      );
    });

    test('should skip disabled providers', async () => {
      const manager = new EmailProviderManager();

      // Disable Brevo
      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe(EmailProvider.RESEND);
    });

    test('should respect provider priority order', async () => {
      const manager = new EmailProviderManager();

      // Change priorities - make Resend higher priority
      manager.updateProviderConfig(EmailProvider.BREVO, { priority: 10 });
      manager.updateProviderConfig(EmailProvider.RESEND, { priority: 1 });

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe(EmailProvider.RESEND);
    });
  });

  describe('send', () => {
    test('should send email using primary provider', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);

      const result = await manager.send(mockEmailParams);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(EmailProvider.BREVO);
      expect(result.messageId).toBe('brevo-id');
      expect(brevo?.send).toHaveBeenCalledWith(mockEmailParams);
    });

    test('should fallback to secondary provider when primary fails', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // Mock Brevo to fail
      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(new Error('Brevo API error'));
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      const result = await manager.send(mockEmailParams);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(EmailProvider.RESEND);
      expect(result.messageId).toBe('resend-id');
      expect(resend?.send).toHaveBeenCalledWith(mockEmailParams);
    });

    test('should throw error when all providers fail', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // Mock both to fail
      const brevoError = new Error('Brevo API error');
      const resendError = new Error('Resend API error');

      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(brevoError);
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'send').mockRejectedValue(resendError);
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      await expect(manager.send(mockEmailParams)).rejects.toThrow(
        'All email providers failed. Last error: Resend API error'
      );
    });

    test('should skip unavailable providers and try next', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // Mock Brevo as unavailable but not throwing
      if (brevo) {
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(false);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      const result = await manager.send(mockEmailParams);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(EmailProvider.RESEND);
      expect(resend?.send).toHaveBeenCalledWith(mockEmailParams);
      expect(brevo?.send).not.toHaveBeenCalled();
    });

    test('should handle error object that is not instanceof Error', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // Mock Brevo to throw a non-Error object
      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue('String error message');
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      const result = await manager.send(mockEmailParams);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(EmailProvider.RESEND);
    });

    test('should handle provider throwing null/undefined', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      // Mock Brevo to throw null
      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(null);
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      const result = await manager.send(mockEmailParams);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(EmailProvider.RESEND);
    });
  });

  describe('registerProvider', () => {
    test('should register new provider adapter', async () => {
      const manager = new EmailProviderManager();

      const customConfig: IEmailProviderConfig = {
        provider: 'custom' as EmailProvider,
        tier: 'free',
        priority: 5,
        enabled: true,
      };

      const customAdapter = createMockAdapter('custom' as EmailProvider, customConfig);

      manager.registerProvider(customAdapter);

      const providers = manager.getAllProviders();
      expect(providers).toHaveLength(3);
      expect(providers.map(p => p.getProviderName())).toContain('custom');
    });

    test('should replace existing provider when registering with same name', async () => {
      const manager = new EmailProviderManager();

      const newBrevoConfig: IEmailProviderConfig = {
        ...mockBrevoConfig,
        priority: 99,
      };

      const newBrevoAdapter = createMockAdapter(EmailProvider.BREVO, newBrevoConfig);

      manager.registerProvider(newBrevoAdapter);

      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      expect(brevo?.getConfig().priority).toBe(99);
    });
  });

  describe('getAllProviders', () => {
    test('should return all registered providers', async () => {
      const manager = new EmailProviderManager();
      const providers = manager.getAllProviders();

      expect(providers).toHaveLength(2);
      expect(providers.every(p => typeof p.getProviderName === 'function')).toBe(true);
      expect(providers.every(p => typeof p.getConfig === 'function')).toBe(true);
    });

    test('should include custom registered providers', async () => {
      const manager = new EmailProviderManager();

      const customAdapter = createMockAdapter('custom' as EmailProvider, {
        provider: 'custom' as EmailProvider,
        tier: 'free',
        priority: 5,
        enabled: true,
      });

      manager.registerProvider(customAdapter);

      const providers = manager.getAllProviders();
      expect(providers).toHaveLength(3);
    });
  });

  describe('getProviderByType', () => {
    test('should return provider by type', async () => {
      const manager = new EmailProviderManager();

      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      expect(brevo?.getProviderName()).toBe(EmailProvider.BREVO);
      expect(resend?.getProviderName()).toBe(EmailProvider.RESEND);
    });

    test('should return undefined for non-existent provider', async () => {
      const manager = new EmailProviderManager();

      const provider = manager.getProviderByType('nonexistent' as EmailProvider);

      expect(provider).toBeUndefined();
    });
  });

  describe('updateProviderConfig', () => {
    test('should update provider configuration', async () => {
      const manager = new EmailProviderManager();

      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });

      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      expect(brevo?.getConfig().enabled).toBe(false);
    });

    test('should update multiple config fields', async () => {
      const manager = new EmailProviderManager();

      manager.updateProviderConfig(EmailProvider.RESEND, {
        enabled: false,
        priority: 10,
        tier: 'paid',
      });

      const resend = manager.getProviderByType(EmailProvider.RESEND);
      const config = resend?.getConfig();

      expect(config?.enabled).toBe(false);
      expect(config?.priority).toBe(10);
      expect(config?.tier).toBe('paid');
    });

    test('should do nothing for non-existent provider', async () => {
      const manager = new EmailProviderManager();

      expect(() => {
        manager.updateProviderConfig('nonexistent' as EmailProvider, { enabled: false });
      }).not.toThrow();
    });

    test('should preserve unmodified config fields', async () => {
      const manager = new EmailProviderManager();

      const originalConfig = manager.getProviderByType(EmailProvider.BREVO)?.getConfig();

      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });

      const updatedConfig = manager.getProviderByType(EmailProvider.BREVO)?.getConfig();

      expect(updatedConfig?.provider).toBe(originalConfig?.provider);
      expect(updatedConfig?.priority).toBe(originalConfig?.priority);
      expect(updatedConfig?.tier).toBe(originalConfig?.tier);
      expect(updatedConfig?.enabled).toBe(false); // Updated
    });
  });

  describe('getAllProvidersUsage', () => {
    test('should return usage statistics for all providers', async () => {
      const manager = new EmailProviderManager();

      const usage = await manager.getAllProvidersUsage();

      expect(usage).toHaveProperty(EmailProvider.BREVO);
      expect(usage).toHaveProperty(EmailProvider.RESEND);

      expect(usage[EmailProvider.BREVO].provider).toBe(EmailProvider.BREVO);
      expect(usage[EmailProvider.RESEND].provider).toBe(EmailProvider.RESEND);
    });

    test('should include all usage fields', async () => {
      const manager = new EmailProviderManager();

      const usage = await manager.getAllProvidersUsage();

      const brevoUsage = usage[EmailProvider.BREVO];

      expect(brevoUsage).toHaveProperty('provider');
      expect(brevoUsage).toHaveProperty('todayRequests');
      expect(brevoUsage).toHaveProperty('monthCredits');
      expect(brevoUsage).toHaveProperty('lastDailyReset');
      expect(brevoUsage).toHaveProperty('lastMonthlyReset');
      expect(brevoUsage).toHaveProperty('totalRequests');
      expect(brevoUsage).toHaveProperty('totalCredits');
    });

    test('should include custom registered providers in usage', async () => {
      const manager = new EmailProviderManager();

      const customAdapter = createMockAdapter('custom' as EmailProvider, {
        provider: 'custom' as EmailProvider,
        tier: 'free',
        priority: 5,
        enabled: true,
      });

      manager.registerProvider(customAdapter);

      const usage = await manager.getAllProvidersUsage();

      expect(usage).toHaveProperty('custom');
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance on multiple calls', async () => {
      const instance1 = getEmailProviderManager();
      const instance2 = getEmailProviderManager();

      expect(instance1).toBe(instance2);
    });

    test('should create new instance after reset', async () => {
      const instance1 = getEmailProviderManager();
      resetEmailProviderManager();
      const instance2 = getEmailProviderManager();

      expect(instance1).not.toBe(instance2);
    });

    test('should maintain provider registrations in singleton', async () => {
      const manager = getEmailProviderManager();

      const customAdapter = createMockAdapter('custom' as EmailProvider, {
        provider: 'custom' as EmailProvider,
        tier: 'free',
        priority: 5,
        enabled: true,
      });

      manager.registerProvider(customAdapter);

      const sameManager = getEmailProviderManager();
      const providers = sameManager.getAllProviders();

      expect(providers).toHaveLength(3);
      expect(providers.map(p => p.getProviderName())).toContain('custom');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty provider list gracefully', async () => {
      const manager = new EmailProviderManager();

      // Manually clear the providers map
      (
        manager as unknown as { providers: Map<EmailProvider, IEmailProviderAdapter> }
      ).providers.clear();

      await expect(manager.getProvider()).rejects.toThrow('No email providers available');
    });

    test('should handle all providers disabled', async () => {
      const manager = new EmailProviderManager();

      manager.updateProviderConfig(EmailProvider.BREVO, { enabled: false });
      manager.updateProviderConfig(EmailProvider.RESEND, { enabled: false });

      await expect(manager.getProvider()).rejects.toThrow('No email providers available');
    });

    test('should handle provider with priority 0', async () => {
      const manager = new EmailProviderManager();

      // Add provider with priority 0 (highest priority)
      const priorityZeroAdapter = createMockAdapter('priority-zero' as EmailProvider, {
        provider: 'priority-zero' as EmailProvider,
        tier: 'free',
        priority: 0,
        enabled: true,
      });

      manager.registerProvider(priorityZeroAdapter);

      const provider = await manager.getProvider();
      expect(provider.getProviderName()).toBe('priority-zero');
    });

    test('should handle providers with same priority', async () => {
      const manager = new EmailProviderManager();

      // Set both to same priority
      manager.updateProviderConfig(EmailProvider.BREVO, { priority: 1 });
      manager.updateProviderConfig(EmailProvider.RESEND, { priority: 1 });

      // Should still return a provider (implementation may vary)
      const provider = await manager.getProvider();
      expect([EmailProvider.BREVO, EmailProvider.RESEND]).toContain(
        provider.getProviderName() as EmailProvider
      );
    });
  });

  describe('Error Handling', () => {
    test('should log console warnings on provider failure', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(new Error('Provider failed'));
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      await manager.send(mockEmailParams);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Email provider brevo failed, trying next provider:',
        'Provider failed'
      );

      consoleWarnSpy.mockRestore();
    });

    test('should include last error message in final error', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(new Error('First error'));
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'send').mockRejectedValue(new Error('Last error'));
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      await expect(manager.send(mockEmailParams)).rejects.toThrow('Last error');
    });

    test('should handle unknown error when no error message available', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(new Error('Error'));
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'send').mockRejectedValue(null);
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      await expect(manager.send(mockEmailParams)).rejects.toThrow('null');
    });

    test('should convert null error to string', async () => {
      const mockEmailParams: ISendEmailParams = {
        to: 'user@example.com',
        template: 'welcome',
        data: { name: 'Test User' },
        type: 'transactional',
      };

      const manager = new EmailProviderManager();
      const brevo = manager.getProviderByType(EmailProvider.BREVO);
      const resend = manager.getProviderByType(EmailProvider.RESEND);

      if (brevo) {
        vi.spyOn(brevo, 'send').mockRejectedValue(new Error('Error'));
        vi.spyOn(brevo, 'isAvailable').mockResolvedValue(true);
      }
      if (resend) {
        vi.spyOn(resend, 'send').mockRejectedValue(undefined);
        vi.spyOn(resend, 'isAvailable').mockResolvedValue(true);
      }

      await expect(manager.send(mockEmailParams)).rejects.toThrow('undefined');
    });
  });
});
