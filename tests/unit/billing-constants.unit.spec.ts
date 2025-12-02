import { describe, it, expect } from 'vitest';
import { BILLING_COPY } from '@shared/constants/billing';

describe('Billing Constants', () => {
  describe('BILLING_COPY', () => {
    it('should contain all required copy constants', () => {
      expect(BILLING_COPY).toBeDefined();
      expect(typeof BILLING_COPY).toBe('object');
    });

    it('should have subscription-only messaging', () => {
      expect(BILLING_COPY.subscriptionOnly).toBe('Only subscription plans are supported');
      expect(BILLING_COPY.oneTimePaymentsNotSupported).toContain('One-time payments are not allowed');
    });

    it('should have success messaging for subscriptions', () => {
      expect(BILLING_COPY.subscriptionActivated).toBe('Subscription Activated!');
      expect(BILLING_COPY.subscriptionProcessing).toContain('subscription');
      expect(BILLING_COPY.monthlyCreditsAdded).toContain('subscription');
    });

    it('should have error messages for invalid prices', () => {
      expect(BILLING_COPY.invalidPrice).toContain('subscription plans');
    });

    it('should have consistent CTA messaging', () => {
      expect(BILLING_COPY.manageSubscription).toBe('Manage Subscription');
      expect(BILLING_COPY.choosePlan).toBe('Choose Plan');
      expect(BILLING_COPY.changePlan).toBe('Change Plan');
    });

    it('should have plan name constants', () => {
      expect(BILLING_COPY.freePlan).toBe('Free Plan');
      expect(BILLING_COPY.unknownPlan).toBe('Unknown Plan');
    });

    it('should have subscription status labels', () => {
      expect(BILLING_COPY.active).toBe('Active');
      expect(BILLING_COPY.canceled).toBe('Canceled');
      expect(BILLING_COPY.pastDue).toBe('Past Due');
    });

    it('should have copy without hardcoded values', () => {
      // Ensure copy is not referencing specific price IDs or technical details
      Object.values(BILLING_COPY).forEach((copy) => {
        expect(copy).not.toContain('price_');
        expect(copy).not.toContain('cus_');
        expect(copy).not.toContain('sub_');
      });
    });

    it('should have consistent messaging across related concepts', () => {
      // All "credits" related copy should be consistent
      const creditRelatedCopy = Object.entries(BILLING_COPY)
        .filter(([key]) => key.toLowerCase().includes('credit'))
        .map(([, value]) => value);

      creditRelatedCopy.forEach((copy) => {
        expect(typeof copy).toBe('string');
        expect(copy.length).toBeGreaterThan(0);
      });
    });

    it('should support user-friendly error states', () => {
      expect(BILLING_COPY.loadingSubscription).toContain('Loading');
      expect(BILLING_COPY.errorLoadingBilling).toContain('billing');
      expect(BILLING_COPY.tryAgain).toBe('Try Again');
      expect(BILLING_COPY.refresh).toBe('Refresh');
    });

    it('should have appropriate tone for user-facing messages', () => {
      Object.values(BILLING_COPY).forEach((copy) => {
        expect(typeof copy).toBe('string');
        expect(copy.length).toBeGreaterThan(0);
        // Should not be overly technical or contain jargon
        expect(copy).not.toMatch(/\b(API|endpoint|status|code)\b/i);
      });
    });

    it('should have all keys typed correctly', () => {
      // Ensure TypeScript types are working correctly
      const copyKeys = Object.keys(BILLING_COPY) as Array<keyof typeof BILLING_COPY>;
      copyKeys.forEach((key) => {
        expect(typeof BILLING_COPY[key]).toBe('string');
      });
    });
  });
});