/**
 * Centralized Stripe Payment Configuration
 *
 * MIGRATION NOTE: This file now derives values from subscription.config.ts
 * Existing exports are maintained for backward compatibility
 *
 * @deprecated Most exports - Use subscription.config.ts and subscription.utils.ts instead
 */

import { clientEnv, serverEnv } from './env';
import {
  buildStripePrices,
  buildSubscriptionPriceMap,
  buildSubscriptionPlans,
  buildHomepageTiers,
  getPlanByPriceId as getConfigPlanByPriceId,
  getPlanByKey as getConfigPlanByKey,
} from './subscription.utils';

// ============================================
// Backward Compatible Exports
// ============================================

/**
 * @deprecated Use getSubscriptionConfig().plans instead
 * Maintained for backward compatibility - derived from subscription.config.ts
 */
export const STRIPE_PRICES = buildStripePrices();

export type StripePriceKey = keyof typeof STRIPE_PRICES;

/**
 * @deprecated Use IPlanConfig from subscription.types instead
 */
export interface ISubscriptionPlanMetadata {
  key: string;
  name: string;
  creditsPerMonth: number;
  maxRollover: number;
  features: readonly string[];
  recommended?: boolean;
}

/**
 * @deprecated Use getPlanByPriceId() from subscription.utils instead
 * Maintained for backward compatibility - derived from subscription.config.ts
 */
export const SUBSCRIPTION_PRICE_MAP = buildSubscriptionPriceMap();

/**
 * Get plan metadata for a given Stripe price ID
 * Now delegates to subscription.utils
 */
export function getPlanForPriceId(priceId: string): ISubscriptionPlanMetadata | null {
  const plan = getConfigPlanByPriceId(priceId);
  if (!plan) return null;

  return {
    key: plan.key,
    name: plan.name,
    creditsPerMonth: plan.creditsPerCycle,
    maxRollover: plan.maxRollover ?? plan.creditsPerCycle * plan.rolloverMultiplier,
    features: plan.features,
    recommended: plan.recommended,
  };
}

/**
 * Get plan metadata by plan key (e.g., 'hobby', 'pro', 'business')
 * Now delegates to subscription.utils
 */
export function getPlanByKey(key: string): ISubscriptionPlanMetadata | null {
  const plan = getConfigPlanByKey(key);
  if (!plan) return null;

  return {
    key: plan.key,
    name: plan.name,
    creditsPerMonth: plan.creditsPerCycle,
    maxRollover: plan.maxRollover ?? plan.creditsPerCycle * plan.rolloverMultiplier,
    features: plan.features,
    recommended: plan.recommended,
  };
}

/**
 * Get human-readable plan display name from various input sources
 * This is the single source of truth for displaying plan names in UI components
 */
export function getPlanDisplayName(input: {
  priceId?: string | null;
  planKey?: string | null;
  subscriptionTier?: string | null;
}): string {
  const { priceId, planKey, subscriptionTier } = input;

  // Try subscription_tier first (most reliable, human-readable)
  if (subscriptionTier) {
    return subscriptionTier;
  }

  // Try priceId lookup
  if (priceId) {
    const plan = getPlanForPriceId(priceId);
    if (plan) {
      return plan.name;
    }
  }

  // Try planKey lookup
  if (planKey) {
    const plan = getPlanByKey(planKey);
    if (plan) {
      return plan.name;
    }
  }

  return 'Unknown Plan';
}

/**
 * Array of valid subscription price IDs for validation
 */
export const SUBSCRIPTION_PRICE_IDS = Object.keys(SUBSCRIPTION_PRICE_MAP);

/**
 * @deprecated Credit packs are no longer supported. Use subscriptions only.
 * This is kept for backwards compatibility but should not be used.
 */
export const CREDIT_PACKS = {} as const;

/**
 * @deprecated Use getSubscriptionConfig().plans instead
 * Maintained for backward compatibility - derived from subscription.config.ts
 */
export const SUBSCRIPTION_PLANS = buildSubscriptionPlans();

/**
 * Check if Stripe prices are configured
 */
export function isStripePricesConfigured(): boolean {
  return true; // Always return true for static configuration
}

/**
 * Get the price ID for a given key, with validation
 */
export function getPriceId(key: StripePriceKey): string {
  const priceId = STRIPE_PRICES[key];
  if (!priceId || priceId.includes('000000000000000000000')) {
    console.warn(`Stripe Price ID for ${key} is not properly configured.`);
  }
  return priceId;
}

/**
 * @deprecated Use buildHomepageTiers() from subscription.utils instead
 * Maintained for backward compatibility - derived from subscription.config.ts
 */
export const HOMEPAGE_TIERS = buildHomepageTiers();

// =============================================================================
// Stripe Configuration Validation & Access
// =============================================================================

/**
 * Get the Stripe publishable key for client-side usage
 */
export function getStripePublishableKey(): string {
  return clientEnv.STRIPE_PUBLISHABLE_KEY;
}

/**
 * Get the Stripe secret key for server-side usage
 * Only accessible on the server
 */
export function getStripeSecretKey(): string {
  return serverEnv.STRIPE_SECRET_KEY || '';
}

/**
 * Get the Stripe webhook secret for server-side webhook verification
 */
export function getStripeWebhookSecret(): string {
  return serverEnv.STRIPE_WEBHOOK_SECRET || '';
}

/**
 * Complete Stripe configuration object
 * Use this to get all Stripe-related configuration in one place
 */
export function getStripeConfig(): {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  prices: typeof STRIPE_PRICES;
  subscriptionPlans: typeof SUBSCRIPTION_PLANS;
  subscriptionPriceMap: typeof SUBSCRIPTION_PRICE_MAP;
  homepageTiers: typeof HOMEPAGE_TIERS;
} {
  return {
    // Client-side configuration
    publishableKey: clientEnv.STRIPE_PUBLISHABLE_KEY,

    // Server-side configuration (only available on server)
    secretKey: serverEnv.STRIPE_SECRET_KEY || '',
    webhookSecret: serverEnv.STRIPE_WEBHOOK_SECRET || '',

    // Price IDs
    prices: STRIPE_PRICES,

    // Product configurations
    subscriptionPlans: SUBSCRIPTION_PLANS,
    subscriptionPriceMap: SUBSCRIPTION_PRICE_MAP,

    // Homepage pricing
    homepageTiers: HOMEPAGE_TIERS,
  };
}

/**
 * Validate that all required Stripe configuration is present
 * Returns an object with validation results
 */
export function validateStripeConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check client-side configuration
  if (!clientEnv.STRIPE_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
  } else if (
    clientEnv.STRIPE_PUBLISHABLE_KEY.includes('pk_test_xxx') ||
    clientEnv.STRIPE_PUBLISHABLE_KEY.includes('pk_live_xxx')
  ) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY appears to be a placeholder key');
  }

  // Check server-side configuration
  if (!serverEnv.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is not configured');
  } else if (
    serverEnv.STRIPE_SECRET_KEY.includes('dummy') ||
    serverEnv.STRIPE_SECRET_KEY.includes('placeholder')
  ) {
    warnings.push('STRIPE_SECRET_KEY appears to be a dummy/placeholder key');
  }

  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    warnings.push(
      'STRIPE_WEBHOOK_SECRET is not configured - webhook signature verification will fail'
    );
  }

  // Check price IDs
  const missingPrices = Object.entries(STRIPE_PRICES)
    .filter(([, priceId]) => !priceId || priceId.includes('000000000000000000000'))
    .map(([key]) => key);

  if (missingPrices.length > 0) {
    errors.push(`Missing or invalid Stripe Price IDs: ${missingPrices.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if Stripe is properly configured for payments
 * This is a convenience function that returns true if the essential configuration is present
 */
export function isStripeConfigured(): boolean {
  const validation = validateStripeConfig();
  return validation.isValid && serverEnv.STRIPE_SECRET_KEY.length > 0;
}
