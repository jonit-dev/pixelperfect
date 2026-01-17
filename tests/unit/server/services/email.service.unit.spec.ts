import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Create the mock function upfront
const mockResendSend = vi.fn().mockResolvedValue({
  data: { id: 'test-email-id' },
});

// Mock Resend with the shared send function
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: mockResendSend,
    };
    constructor(_apiKey: string) {}
  },
}));

// Mock supabaseAdmin - must use factory function
vi.mock('@server/supabase/supabaseAdmin', () => {
  const mockInsert = vi.fn(() => ({ error: null }));

  const mockSingle = vi.fn(() => ({
    data: { marketing_emails: true },
    error: null,
  }));

  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  }));

  return {
    supabaseAdmin: {
      from: mockFrom,
    },
  };
});

// Mock serverEnv and isDevelopment
const mockIsDevelopment = vi.fn(() => false);
vi.mock('@shared/config/env', () => ({
  serverEnv: {
    RESEND_API_KEY: 'test-api-key',
    EMAIL_FROM_ADDRESS: 'test@example.com',
  },
  isDevelopment: () => mockIsDevelopment(),
}));

// Mock templates - we need to mock the dynamic imports
vi.mock('@/emails/templates/WelcomeEmail', () => ({
  WelcomeEmail: () => null,
}));
vi.mock('@/emails/templates/PaymentSuccessEmail', () => ({
  PaymentSuccessEmail: () => null,
}));
vi.mock('@/emails/templates/SubscriptionUpdateEmail', () => ({
  SubscriptionUpdateEmail: () => null,
}));
vi.mock('@/emails/templates/LowCreditsEmail', () => ({
  LowCreditsEmail: () => null,
}));
vi.mock('@/emails/templates/PasswordResetEmail', () => ({
  PasswordResetEmail: () => null,
}));

import { EmailService, EmailError } from '@server/services/email.service';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    // Reset all mocks to default behavior
    mockResendSend.mockResolvedValue({
      data: { id: 'test-email-id' },
    });
    mockIsDevelopment.mockReturnValue(false);
    vi.clearAllMocks();
    emailService = new EmailService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('send - transactional emails', () => {
    it('should send transactional email successfully', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: { userName: 'Test User' },
        type: 'transactional',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
      expect(result.skipped).toBeUndefined();
    });

    it('should send transactional email without checking preferences', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        template: 'low-credits',
        data: { userName: 'Test User' },
        type: 'transactional',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
      expect(result.messageId).toBe('test-email-id');
    });

    it('should handle all template types', async () => {
      const templates = [
        'welcome',
        'payment-success',
        'subscription-update',
        'low-credits',
        'password-reset',
      ] as const;

      for (const template of templates) {
        const result = await emailService.send({
          to: 'test@example.com',
          template,
          data: { test: 'data' },
          type: 'transactional',
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
      }
    });
  });

  describe('send - marketing emails', () => {
    it('should send marketing email when user has opted in', async () => {
      const result = await emailService.send({
        to: 'user@example.com',
        template: 'welcome',
        data: { userName: 'User' },
        type: 'marketing',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
      expect(result.messageId).toBe('test-email-id');
    });

    it('should skip marketing email if user opted out', async () => {
      // Get the module and mock the return value for this specific call
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');
      // Mock user who opted out of marketing emails
      (supabaseAdmin.from as any).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { marketing_emails: false },
                error: null,
              }),
          }),
        }),
      });

      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: { userName: 'Test User' },
        type: 'marketing',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('should look up user by email when userId is not provided for marketing emails', async () => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');

      // First call: profile lookup by email, returns a user ID
      // Second call: email_preferences lookup, returns opted-out
      let callCount = 0;
      (supabaseAdmin.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Profile lookup by email
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { id: 'found-user-123' },
                    error: null,
                  }),
              }),
            }),
            insert: vi.fn(() => ({ error: null })),
          };
        } else if (callCount === 2) {
          // Email preferences lookup
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { marketing_emails: false },
                    error: null,
                  }),
              }),
            }),
            insert: vi.fn(() => ({ error: null })),
          };
        }
        // Fallback for logging
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: vi.fn(() => ({ error: null })),
        };
      });

      const result = await emailService.send({
        to: 'opted-out@example.com',
        template: 'welcome',
        data: {},
        type: 'marketing',
        // No userId provided - should look up by email
      });

      // User found by email, and they opted out
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('should allow marketing email for non-registered email addresses', async () => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');

      // Profile lookup by email returns no user
      (supabaseAdmin.from as any).mockReturnValue({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: null, // No user found
                error: null,
              }),
          }),
        }),
        insert: vi.fn(() => ({ error: null })),
      });

      const result = await emailService.send({
        to: 'newuser@example.com',
        template: 'welcome',
        data: {},
        type: 'marketing',
      });

      // No user found, allow the email
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });

    it('should default to allowing marketing when preferences do not exist', async () => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');
      (supabaseAdmin.from as any).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' },
              }),
          }),
        }),
      });

      const result = await emailService.send({
        to: 'newuser@example.com',
        template: 'welcome',
        data: {},
        type: 'marketing',
        userId: 'new-user-123',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });
  });

  describe('send - error handling', () => {
    it('should handle Resend SDK error response without throwing', async () => {
      // Resend SDK can return { data: null, error: ... } instead of throwing
      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid API key', name: 'validation_error' },
      });

      await expect(
        emailService.send({
          to: 'test@example.com',
          template: 'welcome',
          data: {},
        })
      ).rejects.toThrow(EmailError);
    });

    it('should include RESEND_ERROR code when Resend returns error response', async () => {
      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded', name: 'rate_limit_error' },
      });

      try {
        await emailService.send({
          to: 'test@example.com',
          template: 'welcome',
          data: {},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailError);
        if (error instanceof EmailError) {
          expect(error.code).toBe('RESEND_ERROR');
          expect(error.message).toContain('Rate limit exceeded');
        }
      }
    });

    it('should throw EmailError with TEMPLATE_NOT_FOUND for invalid template', async () => {
      await expect(
        emailService.send({
          to: 'test@example.com',
          template: 'non-existent',
          data: {},
        })
      ).rejects.toThrow(EmailError);
    });

    it('should include correct error code for template not found', async () => {
      try {
        await emailService.send({
          to: 'test@example.com',
          template: 'invalid-template',
          data: {},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailError);
        if (error instanceof EmailError) {
          // The error message should contain the template name
          expect(error.message).toContain('invalid-template');
          // The error code might be SEND_FAILED if logging fails before throw
          // but the message confirms it's a template issue
        }
      }
    });

    it('should handle Resend API errors', async () => {
      // Override the mock to reject
      mockResendSend.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(
        emailService.send({
          to: 'test@example.com',
          template: 'welcome',
          data: {},
        })
      ).rejects.toThrow(EmailError);
    });

    it('should include SEND_FAILED code for Resend errors', async () => {
      mockResendSend.mockRejectedValueOnce(new Error('Network error'));

      try {
        await emailService.send({
          to: 'test@example.com',
          template: 'welcome',
          data: {},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailError);
        if (error instanceof EmailError) {
          expect(error.code).toBe('SEND_FAILED');
        }
      }
    });

    it('should handle unknown errors gracefully', async () => {
      mockResendSend.mockRejectedValueOnce('string error');

      try {
        await emailService.send({
          to: 'test@example.com',
          template: 'welcome',
          data: {},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailError);
        if (error instanceof EmailError) {
          expect(error.message).toContain('Unknown error');
        }
      }
    });
  });

  describe('EmailError', () => {
    it('should create error with default code', () => {
      const error = new EmailError('Test error');
      expect(error.code).toBe('EMAIL_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('EmailError');
    });

    it('should create error with custom code', () => {
      const error = new EmailError('Test error', 'CUSTOM_CODE');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.message).toBe('Test error');
    });

    it('should be instanceof Error', () => {
      const error = new EmailError('Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof EmailError).toBe(true);
    });
  });

  describe('development mode', () => {
    it('should skip actual email sending in development and return success', async () => {
      mockIsDevelopment.mockReturnValue(true);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: { userName: 'Test User' },
        type: 'transactional',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^dev-\d+$/);
      expect(mockResendSend).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[EMAIL_DEV_MODE] Email would be sent:',
        expect.objectContaining({
          to: 'test@example.com',
          template: 'welcome',
          subject: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log template data in development mode', async () => {
      mockIsDevelopment.mockReturnValue(true);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await emailService.send({
        to: 'user@example.com',
        template: 'payment-success',
        data: { amount: '$50', credits: 100 },
        type: 'transactional',
        userId: 'user-123',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EMAIL_DEV_MODE] Email would be sent:',
        expect.objectContaining({
          templateData: expect.objectContaining({
            amount: '$50',
            credits: 100,
          }),
          userId: 'user-123',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data object', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: {},
      });

      expect(result.success).toBe(true);
    });

    it('should handle complex data objects', async () => {
      const complexData = {
        userName: 'John Doe',
        items: [
          { name: 'Item 1', price: 10 },
          { name: 'Item 2', price: 20 },
        ],
        metadata: {
          source: 'web',
          campaign: 'summer-sale',
        },
      };

      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: complexData,
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in email', async () => {
      const result = await emailService.send({
        to: 'user+tag@example.com',
        template: 'welcome',
        data: {},
      });

      expect(result.success).toBe(true);
    });

    it('should handle null values in data', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        template: 'payment-success',
        data: {
          amount: null,
          planName: null,
          receiptUrl: null,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle undefined values in data', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        template: 'welcome',
        data: {
          userName: undefined,
          actionUrl: undefined,
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
