import { describe, test, expect } from 'vitest';
import { getSubscriptionConfig } from '../../shared/config/subscription.config';
import { CREDIT_COSTS } from '../../shared/config/credits.config';

describe('Starter Tier Configuration', () => {
  const config = getSubscriptionConfig();
  const starterPlan = config.plans.find(p => p.key === 'starter');

  test('should have Starter plan enabled', () => {
    expect(starterPlan).toBeDefined();
    expect(starterPlan?.enabled).toBe(true);
  });

  test('should have correct basic Starter plan properties', () => {
    expect(starterPlan?.key).toBe('starter');
    expect(starterPlan?.name).toBe('Starter');
    expect(starterPlan?.description).toBe('Perfect for getting started');
    expect(starterPlan?.displayOrder).toBe(1);
    expect(starterPlan?.recommended).toBe(false);
  });

  test('should have correct pricing for Starter tier', () => {
    expect(starterPlan?.priceInCents).toBe(900); // $9.00
    expect(starterPlan?.currency).toBe('usd');
    expect(starterPlan?.interval).toBe('month');
  });

  test('should have correct credit allocation for Starter tier', () => {
    expect(starterPlan?.creditsPerCycle).toBe(CREDIT_COSTS.STARTER_MONTHLY_CREDITS); // 100
    expect(starterPlan?.maxRollover).toBe(CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 3); // 300 (3x rollover for starter)
    expect(starterPlan?.rolloverMultiplier).toBe(3);
  });

  test('should have correct rollover configuration for Starter tier', () => {
    expect(starterPlan?.creditsExpiration.mode).toBe('never');
    expect(starterPlan?.creditsExpiration.gracePeriodDays).toBe(0);
    expect(starterPlan?.creditsExpiration.sendExpirationWarning).toBe(false);
    expect(starterPlan?.creditsExpiration.warningDaysBefore).toBe(0);
  });

  test('should have correct trial configuration for Starter tier', () => {
    expect(starterPlan?.trial.enabled).toBe(false);
    expect(starterPlan?.trial.durationDays).toBe(0);
    expect(starterPlan?.trial.trialCredits).toBeNull();
    expect(starterPlan?.trial.requirePaymentMethod).toBe(true);
    expect(starterPlan?.trial.allowMultipleTrials).toBe(false);
    expect(starterPlan?.trial.autoConvertToPaid).toBe(true);
  });

  test('should have correct features for Starter tier', () => {
    const expectedFeatures = [
      '100 credits per month',
      'Credits roll over (up to 300)',
      'Email support',
      'All API features included',
      'Batch up to 5 requests',
    ];
    expect(starterPlan?.features).toEqual(expectedFeatures);
  });

  test('should have correct batch limit for Starter tier', () => {
    expect(starterPlan?.batchLimit).toBe(5);
  });

  test('should have valid Stripe price ID format', () => {
    expect(starterPlan?.stripePriceId).toMatch(/^price_/);
    expect(starterPlan?.stripePriceId).toBeTruthy();
  });
});

describe('Rollover Configuration for All Plans (Tiered)', () => {
  const config = getSubscriptionConfig();

  // Expected rollover multipliers by plan (like Let's Enhance model)
  const expectedRolloverMultipliers: Record<string, number> = {
    starter: 3, // 3x rollover for starter
    hobby: 6, // 6x rollover for hobby
    pro: 6, // 6x rollover for pro
    business: 0, // No rollover for business (use it or lose it)
  };

  test('should have tiered rollover configuration', () => {
    const enabledPlans = config.plans.filter(p => p.enabled);

    enabledPlans.forEach(plan => {
      const expectedMultiplier = expectedRolloverMultipliers[plan.key] ?? 6;
      expect(plan.rolloverMultiplier).toBe(expectedMultiplier);

      if (expectedMultiplier > 0) {
        expect(plan.maxRollover).toBe(plan.creditsPerCycle * expectedMultiplier);
      } else {
        expect(plan.maxRollover).toBe(0);
      }
    });
  });

  test('personal tiers (starter, hobby, pro) should have rollover enabled', () => {
    const personalPlans = config.plans.filter(
      p => p.enabled && ['starter', 'hobby', 'pro'].includes(p.key)
    );

    personalPlans.forEach(plan => {
      expect(plan.maxRollover).toBeGreaterThan(0);
      expect(plan.rolloverMultiplier).toBeGreaterThan(0);
      expect(plan.creditsExpiration.mode).toBe('never');
    });
  });

  test("business tier should have no rollover (like Let's Enhance)", () => {
    const businessPlan = config.plans.find(p => p.key === 'business');
    expect(businessPlan?.maxRollover).toBe(0);
    expect(businessPlan?.rolloverMultiplier).toBe(0);
  });

  test('should have rollover or no-rollover mentioned in features for all plans', () => {
    const enabledPlans = config.plans.filter(p => p.enabled);

    enabledPlans.forEach(plan => {
      const hasRolloverFeature = plan.features.some(
        f => f.toLowerCase().includes('roll over') || f.toLowerCase().includes('rollover')
      );
      expect(hasRolloverFeature).toBeTruthy();
    });
  });
});

describe('Plan Display Order', () => {
  const config = getSubscriptionConfig();

  test('should have plans in correct display order', () => {
    const enabledPlans = config.plans
      .filter(p => p.enabled)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    expect(enabledPlans[0].key).toBe('starter');
    expect(enabledPlans[1].key).toBe('hobby');
    expect(enabledPlans[2].key).toBe('pro');
    expect(enabledPlans[3].key).toBe('business');
  });

  test('should have consecutive display order numbers', () => {
    const enabledPlans = config.plans.filter(p => p.enabled);

    enabledPlans.forEach((plan, index) => {
      // Starter has displayOrder 1, Hobby has 2, etc.
      expect(plan.displayOrder).toBe(index + 1);
    });
  });
});

describe('Credits Configuration Constants', () => {
  test('should have STARTER_MONTHLY_CREDITS defined correctly', () => {
    expect(CREDIT_COSTS.STARTER_MONTHLY_CREDITS).toBe(100);
  });

  test('should have all monthly credit constants defined', () => {
    expect(CREDIT_COSTS.STARTER_MONTHLY_CREDITS).toBe(100);
    expect(CREDIT_COSTS.HOBBY_MONTHLY_CREDITS).toBe(200);
    expect(CREDIT_COSTS.PRO_MONTHLY_CREDITS).toBe(1000);
    expect(CREDIT_COSTS.BUSINESS_MONTHLY_CREDITS).toBe(5000);
  });

  test('should have increasing credit amounts across tiers', () => {
    expect(CREDIT_COSTS.STARTER_MONTHLY_CREDITS).toBeLessThan(CREDIT_COSTS.HOBBY_MONTHLY_CREDITS);
    expect(CREDIT_COSTS.HOBBY_MONTHLY_CREDITS).toBeLessThan(CREDIT_COSTS.PRO_MONTHLY_CREDITS);
    expect(CREDIT_COSTS.PRO_MONTHLY_CREDITS).toBeLessThan(CREDIT_COSTS.BUSINESS_MONTHLY_CREDITS);
  });
});

describe('Starter vs Free Tier Comparison', () => {
  const config = getSubscriptionConfig();
  const starterPlan = config.plans.find(p => p.key === 'starter');

  test('should offer significantly more credits than free tier', () => {
    expect(starterPlan?.creditsPerCycle).toBeGreaterThan(CREDIT_COSTS.DEFAULT_FREE_CREDITS);
    expect(starterPlan?.creditsPerCycle).toBe(100); // 10x free tier
  });

  test('should have reasonable batch limit compared to free tier', () => {
    expect(starterPlan?.batchLimit).toBeGreaterThan(config.freeUser.batchLimit); // Greater than free tier (5 vs 1)
  });

  test('should have same maximum rollover cap as configured', () => {
    const expectedCap = CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 3; // Starter has 3x rollover
    expect(starterPlan?.maxRollover).toBe(expectedCap);
  });
});
