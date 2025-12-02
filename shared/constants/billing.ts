/**
 * Billing and subscription copy constants
 * Centralized to prevent drift across UI components
 */

export const BILLING_COPY = {
  // General
  activateToManage: 'Activate a subscription to manage billing',
  choosePlanToContinue: 'Choose a plan to continue',
  subscriptionOnly: 'Only subscription plans are supported',
  creditsPerMonth: 'credits per month',
  rolloverIncluded: 'Rollover unused credits',
  allFeaturesIncluded: 'All features included',

  // Checkout errors
  invalidPrice: 'Invalid price ID. Only subscription plans are supported.',
  oneTimePaymentsNotSupported: 'Only subscription plans are supported. One-time payments are not allowed.',
  paymentModeRejected: 'Payment mode not supported. Please choose a subscription plan.',

  // Success messages
  subscriptionActivated: 'Subscription Activated!',
  subscriptionProcessing: 'Activating your subscription...',
  creditsAddedSoon: 'Your credits will be available in a moment',
  monthlyCreditsAdded: 'Monthly subscription credits have been added to your account',
  creditsCapped: 'credits (capped due to rollover limit)',

  // Plan names
  freePlan: 'Free Plan',
  unknownPlan: 'Unknown Plan',
  activePlan: 'Active Plan',

  // Subscription status
  noActiveSubscription: 'No Active Subscription',
  browsePlansToGetStarted: 'Browse our plans to get started!',
  viewPlans: 'View Plans',

  // Billing management
  manageSubscription: 'Manage Subscription',
  choosePlan: 'Choose Plan',
  changePlan: 'Change Plan',
  currentPlan: 'Current Plan',
  upgradePlan: 'Upgrade Plan',
  viewBilling: 'View Billing',
  cancelAtPeriodEnd: 'Your subscription will be canceled at the end of the period.',

  // Credits
  currentBalance: 'Your current balance',
  monthlyCredits: 'Monthly credits',
  creditsWithRollover: 'credits (with rollover up to',
  creditsAvailable: 'Your credits are ready to use',

  // Status badges
  active: 'Active',
  trialing: 'Trial',
  pastDue: 'Past Due',
  canceled: 'Canceled',

  // Error states
  loadingSubscription: 'Loading subscription...',
  loadingBilling: 'Loading billing information...',
  errorLoadingBilling: 'Failed to load billing information',
  tryAgain: 'Try Again',
  refresh: 'Refresh',

  // Email/receipts
  receiptSent: 'A receipt has been sent to your email address.',
  contactSupport: 'contact support',

  // Portal/CTA
  goToDashboard: 'Go to Dashboard',
  backToDashboard: 'Back to Dashboard',
  pricingPage: 'View Pricing Plans',
} as const;

export type BillingCopyKey = keyof typeof BILLING_COPY;