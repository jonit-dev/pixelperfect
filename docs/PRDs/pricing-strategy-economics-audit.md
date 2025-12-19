# PRD: Pricing Strategy & Unit Economics Audit

**Version:** 1.0
**Status:** Draft
**Date:** December 4, 2025
**Author:** Principal Architect

---

## Executive Summary

This PRD audits the current subscription pricing against actual infrastructure costs and competitive positioning. The analysis reveals **critical unit economics issues** with the current credit model when using the premium "Nano Banana Pro" model at $0.13/image.

### Key Findings

| Metric           | Current State               | Issue                                            |
| ---------------- | --------------------------- | ------------------------------------------------ |
| Cost per image   | **$0.13** (Nano Banana Pro) | 48-76x higher than Real-ESRGAN ($0.0017-0.0027)  |
| Hobby margin     | **-$7/month** (loss)        | Negative at full utilization                     |
| Pro margin       | **-$81/month** (loss)       | Negative at full utilization                     |
| Business margin  | **-$501/month** (loss)      | Negative at full utilization                     |
| Break-even usage | ~15-38%                     | Plans only profitable if users don't use credits |

### Critical Decision Required

1. **Option A:** Switch to lower-cost model (Real-ESRGAN at $0.0017/image) - 95%+ margins
2. **Option B:** Restructure pricing for premium model - 3-5x price increase needed
3. **Option C:** Hybrid approach - tiered quality with cost-appropriate pricing

---

## 1. Context Analysis

### 1.1 Files Analyzed

```
/home/joao/projects/myimageupscaler.com/shared/config/subscription.config.ts
/home/joao/projects/myimageupscaler.com/shared/config/subscription.utils.ts
/home/joao/projects/myimageupscaler.com/shared/config/stripe.ts
/home/joao/projects/myimageupscaler.com/client/components/myimageupscaler.com/Pricing.tsx
/home/joao/projects/myimageupscaler.com/docs/business-model-canvas/competitor-analysis.md
```

### 1.2 Current Subscription Configuration

| Plan     | Price | Credits/Month | Effective $/Credit | Current Cost/Credit |
| -------- | ----- | ------------- | ------------------ | ------------------- |
| Free     | $0    | 10 (one-time) | N/A                | $0.13               |
| Hobby    | $19   | 200           | $0.095             | $0.13               |
| Pro      | $49   | 1,000         | $0.049             | $0.13               |
| Business | $149  | 5,000         | $0.030             | $0.13               |

### 1.3 Credit Cost per Operation

```typescript
// Current configuration
creditCosts: {
  modes: {
    upscale: 1,   // 1 credit = $0.13 cost
    enhance: 2,   // 2 credits = $0.26 cost
    both: 2,      // 2 credits = $0.26 cost
    custom: 2,    // 2 credits = $0.26 cost
  }
}
```

### 1.4 Problem Statement

**The current pricing model is fundamentally broken.** At $0.13/image cost for the Nano Banana Pro model, the business loses money on every transaction when users utilize their full credit allocation. This creates a perverse incentive where user engagement equals business loss.

---

## 2. Unit Economics Analysis

### 2.1 Cost Structure Breakdown

#### Infrastructure Cost per Image

| Model                | Cost/Image | Processing Time | Quality     |
| -------------------- | ---------- | --------------- | ----------- |
| **Nano Banana Pro**  | $0.13      | ~5-10s          | Premium     |
| Real-ESRGAN (T4)     | $0.0017    | ~1.8s           | Good        |
| Real-ESRGAN (A100)   | $0.0027    | ~0.7s           | Good        |
| Real-ESRGAN + GFPGAN | $0.0025    | ~2s             | Good + Face |

#### Current Plan Economics (100% Credit Utilization)

```
HOBBY PLAN ($19/month, 200 credits)
├── Revenue: $19.00
├── COGS (200 × $0.13): $26.00
├── Gross Profit: -$7.00
└── Margin: -36.8% ❌ LOSS

PRO PLAN ($49/month, 1,000 credits)
├── Revenue: $49.00
├── COGS (1,000 × $0.13): $130.00
├── Gross Profit: -$81.00
└── Margin: -165.3% ❌ LOSS

BUSINESS PLAN ($149/month, 5,000 credits)
├── Revenue: $149.00
├── COGS (5,000 × $0.13): $650.00
├── Gross Profit: -$501.00
└── Margin: -336.2% ❌ LOSS
```

### 2.2 Break-Even Analysis

To achieve positive margins, users must NOT use their full credits:

| Plan     | Break-Even Usage    | Max Profitable Usage       |
| -------- | ------------------- | -------------------------- |
| Hobby    | 146 credits (73%)   | Cannot break even at $0.13 |
| Pro      | 377 credits (38%)   | Cannot break even at $0.13 |
| Business | 1,146 credits (23%) | Cannot break even at $0.13 |

**Reality Check:** With $0.13/image, **no plan can break even at full utilization**.

### 2.3 Comparison: If Using Real-ESRGAN ($0.0017/image)

```
HOBBY PLAN (with Real-ESRGAN)
├── Revenue: $19.00
├── COGS (200 × $0.0017): $0.34
├── Gross Profit: $18.66
└── Margin: 98.2% ✅

PRO PLAN (with Real-ESRGAN)
├── Revenue: $49.00
├── COGS (1,000 × $0.0017): $1.70
├── Gross Profit: $47.30
└── Margin: 96.5% ✅

BUSINESS PLAN (with Real-ESRGAN)
├── Revenue: $149.00
├── COGS (5,000 × $0.0017): $8.50
├── Gross Profit: $140.50
└── Margin: 94.3% ✅
```

---

## 3. Competitive Pricing Analysis

### 3.1 Market Comparison (Verified 2025)

| Competitor                        | Plan      | Price  | Credits/Images | $/Image  |
| --------------------------------- | --------- | ------ | -------------- | -------- |
| **myimageupscaler.com (Current)** | Hobby     | $19    | 200            | $0.095   |
| **myimageupscaler.com (Current)** | Pro       | $49    | 1,000          | $0.049   |
| **myimageupscaler.com (Current)** | Business  | $149   | 5,000          | $0.030   |
| Let's Enhance                     | Personal  | $9     | 100            | $0.090   |
| Let's Enhance                     | Personal+ | $24    | 300            | $0.080   |
| Let's Enhance                     | Business  | $72    | 1,000          | $0.072   |
| Icons8                            | Limited   | $9     | 100            | $0.090   |
| Icons8                            | Unlimited | $99    | Unlimited      | Variable |
| Magnific AI                       | Pro       | $39    | ~200 normal    | $0.195   |
| Magnific AI                       | Premium   | Higher | ~550 normal    | ~$0.12   |
| Topaz Labs                        | Gigapixel | $12/mo | Unlimited      | Variable |

### 3.2 Positioning Gap

**Current myimageupscaler.com pricing is competitively positioned** for the market, BUT:

- Competitors use lower-cost models ($0.001-0.003/image)
- Magnific AI (similar premium pricing) charges $39/month for 200 images

### 3.3 Feature Comparison Claims Audit

| Claim in UI                            | Verified           | Notes                        |
| -------------------------------------- | ------------------ | ---------------------------- |
| "200 credits per month"                | ✅ Yes             | Correctly configured         |
| "Credits reset monthly"                | ✅ Yes             | `mode: 'end_of_cycle'`       |
| "Email support"                        | ⚠️ Unverified      | No support system found      |
| "All features included"                | ✅ Yes             | No feature gating            |
| "Priority support" (Pro)               | ⚠️ Unverified      | No tiered support system     |
| "24/7 priority support" (Business)     | ⚠️ Unverified      | No support system            |
| "Dedicated account manager" (Business) | ❌ Not implemented | No account manager system    |
| "Custom integrations" (Business)       | ❌ Not implemented | No custom integration system |

**Finding:** Business plan claims features that don't exist yet.

---

## 4. Proposed Pricing Strategy

### 4.1 Option A: Switch to Lower-Cost Model (Recommended)

**Strategy:** Use Real-ESRGAN as primary model, offer premium model as optional upgrade.

```typescript
// Proposed credit costs
creditCosts: {
  modes: {
    upscale: 1,       // Real-ESRGAN: $0.0017/credit
    enhance: 2,       // Real-ESRGAN: $0.0034/credit
    both: 2,          // Real-ESRGAN: $0.0034/credit
    custom: 2,        // Real-ESRGAN: $0.0034/credit
    premium_upscale: 10,  // Nano Banana Pro: $0.13/credit
    premium_enhance: 20,  // Nano Banana Pro: $0.26/credit
  }
}
```

**Unit Economics with Real-ESRGAN:**

| Plan     | Revenue | COGS  | Gross Margin |
| -------- | ------- | ----- | ------------ |
| Hobby    | $19     | $0.34 | **98.2%**    |
| Pro      | $49     | $1.70 | **96.5%**    |
| Business | $149    | $8.50 | **94.3%**    |

### 4.2 Option B: Raise Prices for Premium Model

**Strategy:** If Nano Banana Pro is required, pricing must reflect costs.

| Plan     | Current | Proposed | Credits | $/Credit |
| -------- | ------- | -------- | ------- | -------- |
| Hobby    | $19     | $49      | 200     | $0.245   |
| Pro      | $49     | $199     | 1,000   | $0.199   |
| Business | $149    | $749     | 5,000   | $0.150   |

**Margins at new pricing:**

| Plan     | Revenue | COGS | Gross Margin |
| -------- | ------- | ---- | ------------ |
| Hobby    | $49     | $26  | **47.0%**    |
| Pro      | $199    | $130 | **34.7%**    |
| Business | $749    | $650 | **13.2%**    |

**Problem:** These prices are 2-5x competitor pricing. Unlikely to be competitive.

### 4.3 Option C: Hybrid Tiered Quality (Recommended)

**Strategy:** Offer quality tiers within each plan.

```
FREE TIER
├── 10 credits (one-time)
├── Standard quality (Real-ESRGAN)
└── Watermarked outputs

HOBBY ($19/month)
├── 200 standard credits
├── Standard quality (Real-ESRGAN)
├── 20 premium credits (optional purchase)
└── No watermarks

PRO ($49/month) ⭐ Recommended
├── 500 standard credits
├── 100 premium credits included
├── Priority processing
└── All features

BUSINESS ($149/month)
├── 2,000 standard credits
├── 500 premium credits included
├── API access
└── Priority support
```

**Credit values (hybrid):**

| Quality  | Model           | Cost/Credit | Standard Credits | Premium Credits |
| -------- | --------------- | ----------- | ---------------- | --------------- |
| Standard | Real-ESRGAN     | $0.0017     | 1 credit         | -               |
| Premium  | Nano Banana Pro | $0.13       | -                | 1 credit        |

---

## 5. Recommended Configuration Changes

### 5.1 Updated subscription.config.ts

```typescript
export const SUBSCRIPTION_CONFIG: ISubscriptionConfig = {
  version: '2.0.0',

  plans: [
    {
      key: 'hobby',
      name: 'Hobby',
      stripePriceId: 'price_1SZmVyALMLhQocpf0H7n5ls8',
      priceInCents: 1900, // $19.00
      currency: 'usd',
      interval: 'month',
      creditsPerCycle: 200,
      premiumCreditsPerCycle: 0, // No premium credits
      maxRollover: null,
      rolloverMultiplier: 6,
      trial: { enabled: false, ... },
      creditsExpiration: { mode: 'end_of_cycle', ... },
      features: [
        '200 credits per month',
        'Standard quality processing',
        'Credits reset monthly',
        'Email support',
        '2x & 4x upscaling',
      ],
      recommended: false,
      description: 'For personal projects',
      displayOrder: 1,
      enabled: true,
    },
    {
      key: 'pro',
      name: 'Professional',
      stripePriceId: 'price_1SZmVzALMLhQocpfPyRX2W8D',
      priceInCents: 4900, // $49.00
      currency: 'usd',
      interval: 'month',
      creditsPerCycle: 500,
      premiumCreditsPerCycle: 100, // 100 premium credits
      maxRollover: null,
      rolloverMultiplier: 6,
      trial: { enabled: false, ... },
      creditsExpiration: { mode: 'end_of_cycle', ... },
      features: [
        '500 standard credits per month',
        '100 premium credits per month',
        'Premium quality processing',
        'Priority support',
        'All features included',
        'Early access to new features',
      ],
      recommended: true,
      description: 'For professionals',
      displayOrder: 2,
      enabled: true,
    },
    {
      key: 'business',
      name: 'Business',
      stripePriceId: 'price_1SZmVzALMLhQocpfqPk9spg4',
      priceInCents: 14900, // $149.00
      currency: 'usd',
      interval: 'month',
      creditsPerCycle: 2000,
      premiumCreditsPerCycle: 500, // 500 premium credits
      maxRollover: null,
      rolloverMultiplier: 6,
      trial: { enabled: false, ... },
      creditsExpiration: { mode: 'end_of_cycle', ... },
      features: [
        '2,000 standard credits per month',
        '500 premium credits per month',
        'Premium quality processing',
        'API access',
        'Priority support',
        'Batch processing',
      ],
      recommended: false,
      description: 'For teams and agencies',
      displayOrder: 3,
      enabled: true,
    },
  ],

  creditCosts: {
    modes: {
      upscale: 1,   // Standard quality
      enhance: 2,   // Standard quality
      both: 2,      // Standard quality
      custom: 2,    // Standard quality
    },
    premiumMultiplier: 10, // Premium credits cost 10x more
    scaleMultipliers: {
      '2x': 1.0,
      '4x': 1.0,
    },
    options: {
      customPrompt: 0,
      priorityProcessing: 1,
      batchPerImage: 0,
    },
    minimumCost: 1,
    maximumCost: 20, // Raised for premium
  },

  freeUser: {
    initialCredits: 10,
    monthlyRefresh: false,
    monthlyCredits: 0,
    maxBalance: 10,
  },

  // ... rest unchanged
};
```

### 5.2 Unit Economics with Proposed Changes

```
HOBBY PLAN (Proposed)
├── Revenue: $19.00
├── Standard COGS (200 × $0.0017): $0.34
├── Gross Profit: $18.66
└── Margin: 98.2% ✅

PRO PLAN (Proposed)
├── Revenue: $49.00
├── Standard COGS (500 × $0.0017): $0.85
├── Premium COGS (100 × $0.13): $13.00
├── Total COGS: $13.85
├── Gross Profit: $35.15
└── Margin: 71.7% ✅

BUSINESS PLAN (Proposed)
├── Revenue: $149.00
├── Standard COGS (2,000 × $0.0017): $3.40
├── Premium COGS (500 × $0.13): $65.00
├── Total COGS: $68.40
├── Gross Profit: $80.60
└── Margin: 54.1% ✅
```

---

## 6. Feature Claims Audit & Fixes

### 6.1 Unverified Claims to Remove

| Current Claim               | Plan     | Action                             |
| --------------------------- | -------- | ---------------------------------- |
| "Priority support"          | Pro      | Remove until support system exists |
| "24/7 priority support"     | Business | Remove until support system exists |
| "Dedicated account manager" | Business | Remove - not implemented           |
| "Custom integrations"       | Business | Remove - not implemented           |

### 6.2 Proposed Updated Features

**Hobby Plan:**

```typescript
features: [
  '200 credits per month',
  'Standard quality processing',
  '2x & 4x upscaling',
  'No watermarks',
  'Credits reset monthly',
];
```

**Pro Plan:**

```typescript
features: [
  '500 standard + 100 premium credits',
  'Premium quality processing',
  'All enhancement modes',
  'Priority processing queue',
  'Credits reset monthly',
];
```

**Business Plan:**

```typescript
features: [
  '2,000 standard + 500 premium credits',
  'Premium quality processing',
  'API access (coming soon)',
  'Batch processing',
  'Priority processing queue',
];
```

---

## 7. Implementation Plan

### Phase 1: Immediate Fixes (Week 1)

- [ ] Update `subscription.config.ts` with corrected feature claims
- [ ] Remove unimplemented feature claims from UI
- [ ] Add infrastructure cost tracking to operations
- [ ] Document actual costs vs. revenue per user

### Phase 2: Model Selection (Week 2)

- [ ] A/B test Real-ESRGAN vs. Nano Banana Pro quality
- [ ] Survey users on quality tier preference
- [ ] Implement model selection in image generation service
- [ ] Add quality tier parameter to credit calculation

### Phase 3: Pricing Restructure (Week 3-4)

- [ ] Update credit allocations per plan
- [ ] Add `premiumCreditsPerCycle` to config
- [ ] Update UI to show dual credit types
- [ ] Implement premium credit deduction logic
- [ ] Update Stripe products/prices if needed

### Phase 4: Monitoring (Ongoing)

- [ ] Track credit utilization per plan
- [ ] Monitor gross margin per user
- [ ] Alert on negative margin users
- [ ] Quarterly pricing review

---

## 8. Risk Assessment

### 8.1 Risks of Maintaining Current Pricing

| Risk                             | Probability | Impact   | Mitigation                    |
| -------------------------------- | ----------- | -------- | ----------------------------- |
| Negative margins at scale        | High        | Critical | Switch models or raise prices |
| User perception of lower quality | Medium      | High     | A/B test before switching     |
| Competitor undercut              | Medium      | Medium   | Focus on differentiation      |

### 8.2 Risks of Proposed Changes

| Risk                          | Probability | Impact | Mitigation                              |
| ----------------------------- | ----------- | ------ | --------------------------------------- |
| User confusion (dual credits) | Medium      | Medium | Clear UI explanation                    |
| Churn from feature removal    | Low         | Low    | Only remove unimplemented features      |
| Quality perception drop       | Medium      | High   | Position standard as "fast" not "worse" |

---

## 9. Acceptance Criteria

- [ ] All plans achieve positive gross margin (>50%)
- [ ] No unimplemented features claimed in UI
- [ ] Unit economics documented and tracked
- [ ] Model costs monitored per operation
- [ ] Pricing competitive with Let's Enhance/Icons8
- [ ] Clear quality tier communication in UI

---

## 10. Appendix: Competitor Pricing Deep Dive

### Let's Enhance (Direct Competitor)

| Plan          | Price | Credits | $/Credit | Rollover           |
| ------------- | ----- | ------- | -------- | ------------------ |
| Personal 100  | $9    | 100     | $0.090   | 6x (Personal only) |
| Personal 300  | $24   | 300     | $0.080   | 6x (Personal only) |
| Business 1000 | $72   | 1,000   | $0.072   | No                 |
| Business 2500 | $160  | 2,500   | $0.064   | No                 |

### Magnific AI (Premium Competitor)

| Plan    | Price  | Credits | $/Credit | Notes                |
| ------- | ------ | ------- | -------- | -------------------- |
| Pro     | $39    | ~200    | $0.195   | No trial, no refunds |
| Premium | Higher | ~550    | ~$0.12   | Enterprise tier      |

### Our Competitive Position

**Current (broken):**

- Cheaper than Magnific but at a loss
- Similar to Let's Enhance pricing but unsustainable costs

**Proposed (sustainable):**

- Hobby: Competitive with Let's Enhance Personal
- Pro: Positioned between Let's Enhance and Magnific
- Business: Competitive with Let's Enhance Business

---

## 11. Decision Required

**Immediate action needed from stakeholders:**

1. **Which model to use as default?**
   - [ ] Real-ESRGAN (cheap, good quality)
   - [ ] Nano Banana Pro (expensive, premium quality)
   - [ ] Hybrid (both, user choice)

2. **Pricing approach?**
   - [ ] Option A: Lower costs, keep current prices
   - [ ] Option B: Keep premium model, raise prices 3-5x
   - [ ] Option C: Hybrid tiers (recommended)

3. **Timeline?**
   - [ ] Immediate (this sprint)
   - [ ] Next sprint
   - [ ] After user research

---

**Document End**

_Generated: December 4, 2025_
_Review Required: Business & Engineering Leads_
