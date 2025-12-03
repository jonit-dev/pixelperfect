import { describe, test, expect } from 'vitest';
import { SUBSCRIPTION_CONFIG, getSubscriptionConfig } from '@shared/config/subscription.config';
import { validateSubscriptionConfig } from '@shared/config/subscription.validator';
import {
  getPlanByPriceId,
  getPlanByKey,
  getEnabledPlans,
  getRecommendedPlan,
  calculateCreditCost,
  getCreditCostForMode,
  getFreeUserCredits,
  getLowCreditThreshold,
} from '@shared/config/subscription.utils';

describe('Subscription Configuration', () => {
  describe('Configuration Validation', () => {
    test('default config passes validation', () => {
      expect(() => {
        validateSubscriptionConfig(SUBSCRIPTION_CONFIG);
      }).not.toThrow();
    });

    test('config has all required fields', () => {
      const config = getSubscriptionConfig();
      expect(config.version).toBeDefined();
      expect(config.plans).toBeInstanceOf(Array);
      expect(config.plans.length).toBeGreaterThan(0);
      expect(config.creditCosts).toBeDefined();
      expect(config.freeUser).toBeDefined();
      expect(config.warnings).toBeDefined();
      expect(config.defaults).toBeDefined();
    });

    test('all plans have valid Stripe price IDs', () => {
      const config = getSubscriptionConfig();
      for (const plan of config.plans) {
        expect(plan.stripePriceId).toMatch(/^price_/);
      }
    });

    test('credit costs are positive', () => {
      const config = getSubscriptionConfig();
      expect(config.creditCosts.modes.upscale).toBeGreaterThan(0);
      expect(config.creditCosts.modes.enhance).toBeGreaterThan(0);
      expect(config.creditCosts.modes.both).toBeGreaterThan(0);
      expect(config.creditCosts.modes.custom).toBeGreaterThan(0);
    });

    test('minimumCost <= maximumCost', () => {
      const config = getSubscriptionConfig();
      expect(config.creditCosts.minimumCost).toBeLessThanOrEqual(config.creditCosts.maximumCost);
    });
  });

  describe('Plan Lookup Functions', () => {
    test('getPlanByPriceId returns correct plan', () => {
      const plan = getPlanByPriceId('price_1SZmVzALMLhQocpfPyRX2W8D');
      expect(plan).toBeDefined();
      expect(plan?.key).toBe('pro');
      expect(plan?.name).toBe('Professional');
    });

    test('getPlanByPriceId returns null for invalid price ID', () => {
      const plan = getPlanByPriceId('invalid_price_id');
      expect(plan).toBeNull();
    });

    test('getPlanByKey returns correct plan', () => {
      const plan = getPlanByKey('hobby');
      expect(plan).toBeDefined();
      expect(plan?.stripePriceId).toBe('price_1SZmVyALMLhQocpf0H7n5ls8');
      expect(plan?.creditsPerCycle).toBe(200);
    });

    test('getPlanByKey returns null for invalid key', () => {
      const plan = getPlanByKey('invalid_key');
      expect(plan).toBeNull();
    });

    test('getEnabledPlans returns only enabled plans', () => {
      const plans = getEnabledPlans();
      expect(plans.every(p => p.enabled)).toBe(true);
    });

    test('getEnabledPlans returns plans in display order', () => {
      const plans = getEnabledPlans();
      for (let i = 1; i < plans.length; i++) {
        expect(plans[i].displayOrder).toBeGreaterThanOrEqual(plans[i - 1].displayOrder);
      }
    });

    test('getRecommendedPlan returns the recommended plan', () => {
      const plan = getRecommendedPlan();
      expect(plan).toBeDefined();
      expect(plan?.recommended).toBe(true);
      expect(plan?.key).toBe('pro'); // Pro is marked as recommended
    });
  });

  describe('Credit Cost Calculations', () => {
    test('calculateCreditCost for upscale mode', () => {
      const cost = calculateCreditCost({ mode: 'upscale', scale: 2 });
      expect(cost).toBe(1);
    });

    test('calculateCreditCost for enhance mode', () => {
      const cost = calculateCreditCost({ mode: 'enhance', scale: 2 });
      expect(cost).toBe(2);
    });

    test('calculateCreditCost for both mode', () => {
      const cost = calculateCreditCost({ mode: 'both', scale: 2 });
      expect(cost).toBe(2);
    });

    test('calculateCreditCost for custom mode', () => {
      const cost = calculateCreditCost({ mode: 'custom', scale: 2 });
      expect(cost).toBe(2);
    });

    test('calculateCreditCost with 4x scale', () => {
      // Currently no difference, but configurable
      const cost = calculateCreditCost({ mode: 'upscale', scale: 4 });
      expect(cost).toBe(1);
    });

    test('calculateCreditCost respects minimum cost', () => {
      const cost = calculateCreditCost({ mode: 'upscale' });
      expect(cost).toBeGreaterThanOrEqual(1); // minimumCost = 1
    });

    test('getCreditCostForMode returns correct costs', () => {
      expect(getCreditCostForMode('upscale')).toBe(1);
      expect(getCreditCostForMode('enhance')).toBe(2);
      expect(getCreditCostForMode('both')).toBe(2);
      expect(getCreditCostForMode('custom')).toBe(2);
    });
  });

  describe('Free User & Warnings', () => {
    test('getFreeUserCredits returns initial credits', () => {
      const credits = getFreeUserCredits();
      expect(credits).toBe(10);
    });

    test('getLowCreditThreshold returns warning threshold', () => {
      const threshold = getLowCreditThreshold();
      expect(threshold).toBe(5);
    });
  });

  describe('Plan Configuration Values', () => {
    test('hobby plan has correct values', () => {
      const plan = getPlanByKey('hobby');
      expect(plan?.creditsPerCycle).toBe(200);
      expect(plan?.maxRollover).toBe(1200); // 6× monthly
      expect(plan?.rolloverMultiplier).toBe(6);
      expect(plan?.priceInCents).toBe(1900);
    });

    test('pro plan has correct values', () => {
      const plan = getPlanByKey('pro');
      expect(plan?.creditsPerCycle).toBe(1000);
      expect(plan?.maxRollover).toBe(6000); // 6× monthly
      expect(plan?.rolloverMultiplier).toBe(6);
      expect(plan?.priceInCents).toBe(4900);
      expect(plan?.recommended).toBe(true);
    });

    test('business plan has correct values', () => {
      const plan = getPlanByKey('business');
      expect(plan?.creditsPerCycle).toBe(5000);
      expect(plan?.maxRollover).toBe(30000); // 6× monthly
      expect(plan?.rolloverMultiplier).toBe(6);
      expect(plan?.priceInCents).toBe(14900);
    });
  });

  describe('Trial Configuration (Disabled)', () => {
    test('all plans have trial disabled by default', () => {
      const plans = getEnabledPlans();
      for (const plan of plans) {
        expect(plan.trial.enabled).toBe(false);
        expect(plan.trial.durationDays).toBe(0);
      }
    });
  });

  describe('Credits Expiration Configuration (Never)', () => {
    test('all plans have expiration mode set to never', () => {
      const plans = getEnabledPlans();
      for (const plan of plans) {
        expect(plan.creditsExpiration.mode).toBe('never');
      }
    });
  });
});
