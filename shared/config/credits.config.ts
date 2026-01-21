/**
 * Credit costs configuration
 * Generic SaaS boilerplate credit system
 * Customize for your specific API service
 */

export const CREDIT_COSTS = {
  // Base API call cost - customize based on your service's cost structure
  API_CALL: 1, // Base cost per API call

  // Free tier default credits
  DEFAULT_FREE_CREDITS: 10,
  DEFAULT_TRIAL_CREDITS: 0,

  // Credit pack amounts
  SMALL_PACK_CREDITS: 50,
  MEDIUM_PACK_CREDITS: 200,
  LARGE_PACK_CREDITS: 600,

  // Subscription credit amounts
  STARTER_MONTHLY_CREDITS: 100,
  HOBBY_MONTHLY_CREDITS: 200,
  PRO_MONTHLY_CREDITS: 1000,
  BUSINESS_MONTHLY_CREDITS: 5000,

  // Warning thresholds
  LOW_CREDIT_WARNING_THRESHOLD: 5,
  CREDIT_WARNING_PERCENTAGE: 0.2,
} as const;

export type CreditCost = typeof CREDIT_COSTS;
