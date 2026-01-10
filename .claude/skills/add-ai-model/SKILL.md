# Add AI Model Skill

When adding a new AI model to the image upscaler, follow these steps in order. Each file must be updated for the model to work correctly.

## Overview

- **Provider**: Replicate (primary), Gemini (alternative)
- **Pricing**: USD cost per API call + credit multiplier
- **Tiers**: Models can be restricted to subscription tiers (free, hobby, pro, business)

## Required Files (in order)

### 1. Cost Configuration

**File**: `shared/config/model-costs.config.ts`

Add the USD cost per API call:

```typescript
export const MODEL_COSTS = {
  // ... existing costs
  NEW_MODEL_COST: 0.03, // USD per call
};
```

Add to tier arrays (HOBBY_MODELS, PRO_MODELS, BUSINESS_MODELS):

```typescript
HOBBY_MODELS: [
  // ... existing models
  'new-model-id',
],
```

Add MODEL_CONFIG entry:

```typescript
'new-model-id': {
  cost: MODEL_COSTS.NEW_MODEL_COST,
  multiplier: 3,           // Credit multiplier
  qualityScore: 9.2,       // 1-10 quality rating
  processingTime: MODEL_COSTS.PROCESSING_TIME_MEDIUM,
  maxInputResolution: MODEL_COSTS.MAX_INPUT_RESOLUTION,
  maxOutputResolution: MODEL_COSTS.MAX_OUTPUT_RESOLUTION,
  supportedScales: [
    MODEL_COSTS.DEFAULT_SCALE,
    MODEL_COSTS.MAX_SCALE_STANDARD,
    MODEL_COSTS.MAX_SCALE_PREMIUM,
  ],
  tierRestriction: 'hobby', // null for free, 'hobby'/'pro'/'business' for paid
},
```

If adding a new quality tier, add to PREMIUM_QUALITY_TIERS:

```typescript
PREMIUM_QUALITY_TIERS: ['auto', 'new-tier', 'hd-upscale', ...] as const,
```

---

### 2. Credit Multiplier

**File**: `shared/config/credits.config.ts`

Add the credit multiplier constant:

```typescript
export const CREDIT_COSTS = {
  // ... existing multipliers
  NEW_MODEL_MULTIPLIER: 3, // Credits = base_cost * multiplier
};
```

Add MODEL_CREDIT_COSTS entry:

```typescript
'new-model-id': {
  upscale: CREDIT_COSTS.BASE_UPSCALE_COST * CREDIT_COSTS.NEW_MODEL_MULTIPLIER,
  enhance: CREDIT_COSTS.BASE_ENHANCE_COST * CREDIT_COSTS.NEW_MODEL_MULTIPLIER,
  both: CREDIT_COSTS.BASE_BOTH_COST * CREDIT_COSTS.NEW_MODEL_MULTIPLIER,
  custom: CREDIT_COSTS.BASE_CUSTOM_COST * CREDIT_COSTS.NEW_MODEL_MULTIPLIER,
},
```

---

### 3. Model Registry Types

**File**: `server/services/model-registry.types.ts`

Add to ModelId type:

```typescript
export type ModelId =
  | 'real-esrgan'
  // ... existing models
  | 'new-model-id';
```

---

### 4. Shared Types (Duplicate ModelId)

**File**: `shared/types/coreflow.types.ts`

Add to ModelId type (there's a duplicate here):

```typescript
export type ModelId =
  | 'real-esrgan'
  // ... existing models
  | 'new-model-id';
```

If adding a new quality tier, update QualityTier type:

```typescript
export type QualityTier =
  | 'auto'
  | 'quick'
  | 'face-restore'
  | 'new-tier' // Add in credit order
  | 'hd-upscale';
// ...
```

And add QUALITY_TIER_CONFIG entry:

```typescript
'new-tier': {
  label: 'New Tier Label',
  credits: 3,
  modelId: 'new-model-id',
  description: 'Short description',
  bestFor: 'Use case description',
  smartAnalysisAlwaysOn: false,
},
```

---

### 5. Validation Schema

**File**: `shared/validation/upscale.schema.ts`

If adding a new quality tier, update the Zod enum:

```typescript
qualityTier: z
  .enum(['auto', 'quick', 'face-restore', 'new-tier', 'hd-upscale', ...])
  .default('auto'),
```

---

### 6. Model Registry

**File**: `server/services/model-registry.ts`

Add to DEFAULT_MODEL_VERSIONS:

```typescript
const DEFAULT_MODEL_VERSIONS: Record<string, string> = {
  // ... existing versions
  'new-model-id': 'provider/model-name', // Replicate model identifier
};
```

Add to MODEL_COSTS map:

```typescript
const MODEL_COSTS: Record<string, number> = {
  // ... existing costs
  'new-model-id': CONFIG_MODEL_COSTS.NEW_MODEL_COST,
};
```

Add to MODEL_CREDIT_MULTIPLIERS map:

```typescript
const MODEL_CREDIT_MULTIPLIERS: Record<string, number> = {
  // ... existing multipliers
  'new-model-id': CREDIT_COSTS.NEW_MODEL_MULTIPLIER,
};
```

Add to getModelVersion overrides:

```typescript
private getModelVersion(modelId: string): string {
  const overrides: Record<string, string | undefined> = {
    // ... existing overrides
    'new-model-id': serverEnv.MODEL_VERSION_NEW_MODEL,
  };
  return overrides[modelId] || DEFAULT_MODEL_VERSIONS[modelId];
}
```

Add model config to loadModelsFromEnvironment():

```typescript
{
  id: 'new-model-id',
  displayName: 'Display Name',
  provider: 'replicate',
  modelVersion: this.getModelVersion('new-model-id'),
  capabilities: ['upscale', 'enhance', 'denoise'],
  costPerRun: MODEL_COSTS['new-model-id'],
  creditMultiplier: MODEL_CREDIT_MULTIPLIERS['new-model-id'],
  qualityScore: 9.2,
  processingTimeMs: TIMEOUTS.CLARITY_UPSCALER_PROCESSING_TIME,
  maxInputResolution: CONFIG_MODEL_COSTS.MAX_INPUT_RESOLUTION,
  maxOutputResolution: CONFIG_MODEL_COSTS.MAX_OUTPUT_RESOLUTION,
  supportedScales: [
    CONFIG_MODEL_COSTS.DEFAULT_SCALE,
    CONFIG_MODEL_COSTS.MAX_SCALE_STANDARD,
    CONFIG_MODEL_COSTS.MAX_SCALE_PREMIUM,
  ],
  isEnabled: serverEnv.ENABLE_PREMIUM_MODELS,
  tierRestriction: 'hobby',
},
```

---

### 7. Replicate Service

**File**: `server/services/replicate.service.ts`

Add input interface (check Replicate docs for exact params):

```typescript
interface INewModelInput {
  prompt: string;
  image: string[];
  // ... model-specific params
}
```

Update buildModelInput return type:

```typescript
private buildModelInput(...):
  | IFluxKontextInput
  // ... existing types
  | INewModelInput {
```

Add case in buildModelInput switch:

```typescript
case 'new-model-id': {
  let effectivePrompt = customPrompt;
  if (!effectivePrompt) {
    effectivePrompt = enhance
      ? `Upscale and enhance this image to ${scale}x resolution.`
      : `Upscale this image to ${scale}x resolution.`;
    // Add enhancement instructions...
  }
  return {
    prompt: effectivePrompt,
    image: [imageDataUrl],
    // ... model-specific params
  };
}
```

---

### 8. Environment Variables

**File**: `shared/config/env.ts`

Add to serverEnvSchema:

```typescript
MODEL_VERSION_NEW_MODEL: z.string().optional(),
```

Add to loadServerEnv():

```typescript
MODEL_VERSION_NEW_MODEL: process.env.MODEL_VERSION_NEW_MODEL,
```

---

## Verification Checklist

After making all changes, run:

```bash
yarn verify
```

Then test:

1. Select the new quality tier in UI
2. Process an image
3. Verify credits are deducted correctly
4. Check Replicate dashboard for API call

## Credit Economics Reference

| Cost Range   | Suggested Multiplier | Example                  |
| ------------ | -------------------- | ------------------------ |
| $0.001-0.005 | 1x                   | real-esrgan              |
| $0.005-0.01  | 2x                   | gfpgan                   |
| $0.01-0.05   | 3-4x                 | qwen-image-edit, clarity |
| $0.05-0.10   | 5-6x                 | flux-2-pro               |
| $0.10+       | 7-8x                 | nano-banana-pro          |
