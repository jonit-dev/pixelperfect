/**
 * Brevo Provider Adapter
 *
 * Adapter for Brevo email provider with credit tracking and usage monitoring.
 * Brevo is our first fallback email provider with 300 free emails/day.
 */

import type { ReactElement } from 'react';
import { render } from '@react-email/render';
import { EmailProvider, ProviderTier } from '@shared/types/provider-adapter.types';
import type { IEmailProviderConfig } from '@shared/types/provider-adapter.types';
import { BaseEmailProviderAdapter } from './base-email-provider-adapter';
import { isTest, serverEnv } from '@shared/config/env';
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';

/**
 * Brevo provider configuration
 * Free tier: 300 emails/day
 */
const BREVO_CONFIG: IEmailProviderConfig = {
  provider: EmailProvider.BREVO,
  tier: ProviderTier.HYBRID, // Free tier with paid overage
  priority: 1, // Primary provider - 300 free emails/day
  enabled: true,
  freeTier: {
    dailyRequests: 300, // 300 free emails/day
    monthlyCredits: 9000, // ~300/day * 30 days
    hardLimit: true,
    resetTimezone: 'UTC',
  },
  fallbackProvider: EmailProvider.RESEND, // Fall back to Resend if limits hit
};

/**
 * Adapter for Brevo email provider
 */
export class BrevoProviderAdapter extends BaseEmailProviderAdapter {
  private apiKey: string;

  constructor() {
    super(BREVO_CONFIG);
    this.apiKey = serverEnv.BREVO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('BREVO_API_KEY not configured, Brevo will not be available');
    }
  }

  /**
   * Send email using Brevo API
   */
  protected async sendEmail(
    to: string,
    subject: string,
    reactElement: ReactElement
  ): Promise<{ messageId: string; [key: string]: unknown }> {
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    // Create API instance and set API key
    const api = new TransactionalEmailsApi();
    api.setApiKey(TransactionalEmailsApiApiKeys.apiKey, this.apiKey);

    // Convert React element to HTML string using @react-email/render
    const html = await render(reactElement);

    const sendSmtpEmail = {
      subject,
      htmlContent: html,
      to: [{ email: to }],
      sender: { email: this.fromAddress, name: this.appName },
    };

    const response = await api.sendTransacEmail(sendSmtpEmail);

    return {
      messageId: response.body.messageId || 'unknown',
      provider: 'brevo',
      response: response.body,
    };
  }

  /**
   * Check if Brevo is available (API key configured and within limits)
   * In test mode, always return true to allow tests to work without API keys
   */
  override async isAvailable(): Promise<boolean> {
    // In test mode, always return true to skip actual API calls
    if (isTest()) {
      return true;
    }

    if (!this.apiKey || !this.config.enabled) {
      return false;
    }

    // Check if we're within free tier limits
    return await super.isAvailable();
  }
}

/**
 * Factory function to create Brevo adapter
 */
export function createBrevoAdapter(): BrevoProviderAdapter {
  return new BrevoProviderAdapter();
}
