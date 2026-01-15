# I18N Harcoded Strings Report

**Generated:** 2026-01-09

---

## Summary

| Metric                          | Count |
| ------------------------------- | ----- |
| **Total files with violations** | 116   |
| **Total violations**            | 1,058 |

---

## Violations by Category

| Category                      | Count |
| ----------------------------- | ----- |
| **Descriptions** (`<p>` tags) | 657   |
| **Headings** (`h1-h4`)        | 173   |
| **Labels**                    | 85    |
| **Other**                     | 72    |
| **CTA/Buttons**               | 71    |

---

## Top 30 Files by Violation Count

| Rank | File                                                                            | Violations |
| ---- | ------------------------------------------------------------------------------- | ---------- |
| 1    | `app/[locale]/terms/page.tsx`                                                   | 98         |
| 2    | `app/[locale]/privacy/page.tsx`                                                 | 89         |
| 3    | `app/(pseo)/_components/tools/PrintCalculator.tsx`                              | 40         |
| 4    | `app/[locale]/(pseo)/_components/tools/PrintCalculator.tsx`                     | 40         |
| 5    | `app/(pseo)/_components/tools/BulkImageCompressor.tsx`                          | 35         |
| 6    | `app/[locale]/(pseo)/_components/tools/BulkImageCompressor.tsx`                 | 35         |
| 7    | `app/(pseo)/_components/tools/BulkImageResizer.tsx`                             | 30         |
| 8    | `app/[locale]/(pseo)/_components/tools/BulkImageResizer.tsx`                    | 30         |
| 9    | `app/[locale]/dashboard/admin/users/[userId]/page.tsx`                          | 28         |
| 10   | `app/subscription/confirmed/page.tsx`                                           | 26         |
| 11   | `app/[locale]/dashboard/billing/page.tsx`                                       | 24         |
| 12   | `app/(pseo)/_components/tools/ImageCompressor.tsx`                              | 22         |
| 13   | `app/[locale]/(pseo)/_components/tools/ImageCompressor.tsx`                     | 22         |
| 14   | `app/[locale]/checkout/page.tsx`                                                | 19         |
| 15   | `client/components/admin/UserActionsDropdown.tsx`                               | 19         |
| 16   | `app/[locale]/dashboard/admin/users/page.tsx`                                   | 14         |
| 17   | `client/components/stripe/SubscriptionStatus.tsx`                               | 14         |
| 18   | `app/(pseo)/_components/tools/ImageResizer.tsx`                                 | 13         |
| 19   | `app/[locale]/(pseo)/_components/tools/ImageResizer.tsx`                        | 13         |
| 20   | `client/components/features/workspace/BatchSidebar/CustomInstructionsModal.tsx` | 13         |
| 21   | `client/components/stripe/CreditHistory.tsx`                                    | 12         |
| 22   | `app/(pseo)/_components/tools/FormatConverter.tsx`                              | 11         |
| 23   | `app/[locale]/(pseo)/_components/tools/FormatConverter.tsx`                     | 11         |
| 24   | `client/components/features/image-processing/OversizedImageModal.tsx`           | 11         |
| 25   | `client/components/features/workspace/PreviewArea.tsx`                          | 11         |
| 26   | `app/[locale]/dashboard/admin/page.tsx`                                         | 10         |
| 27   | `client/components/features/workspace/Workspace.tsx`                            | 10         |
| 28   | `app/(pseo)/_components/pseo/templates/ComparePageTemplate.tsx`                 | 9          |
| 29   | `app/(pseo)/_components/tools/BackgroundRemover.tsx`                            | 9          |
| 30   | `app/[locale]/(pseo)/_components/pseo/templates/ComparePageTemplate.tsx`        | 9          |

---

## Detailed Violations (Top 20 Files)

### 1. app/[locale]/terms/page.tsx (98 violations)

```
Line   20: <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
Line   21: {lastUpdated}</p>
Line   25: <h2 className="text-2xl font-semibold text-primary mb-4">1. Acceptance of Terms</h2>
Line   26: <p className="text-muted-foreground mb-4">By accessing or using {clientEnv.NEXT_PUBLIC_APP_NAME}...
Line   27: <p className="text-muted-foreground mb-4">By accessing or using {clientEnv.NEXT_PUBLIC_APP_NAME}...
Line   31: <p className="text-muted-foreground">We reserve the right to update these terms...</p>
... and 90 more
```

### 2. app/[locale]/privacy/page.tsx (89 violations)

```
Line   20: <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
Line   21: {lastUpdated}</p>
Line   25: <h2 className="text-2xl font-semibold text-primary mb-4">1. Introduction</h2>
Line   26: <p className="text-muted-foreground mb-4">Welcome to {clientEnv.NEXT_PUBLIC_APP_NAME}...</p>
Line   27: <p className="text-muted-foreground mb-4">Welcome to {clientEnv.NEXT_PUBLIC_APP_NAME}...</p>
Line   32: <p className="text-muted-foreground">By using {clientEnv.NEXT_PUBLIC_APP_NAME}...</p>
Line   33: <p className="text-muted-foreground">By using {clientEnv.NEXT_PUBLIC_APP_NAME}...</p>
Line   39: <h2 className="text-2xl font-semibold text-primary mb-4">2. Information Collection</h2>
... and 81 more
```

### 3. app/(pseo)/\_components/tools/PrintCalculator.tsx (40 violations)

```
Line  118: <h3 className="mb-4 text-xl font-semibold text-text-primary">Print Size Calculator</h3>
Line  129: 'bg-surface-tertiary text-text-secondary hover:text-text-primary' ... (tab labels)
Line  139: 'bg-surface-tertiary text-text-secondary hover:text-text-primary' ... (tab labels)
Line  148: <label className="mb-2 block text-sm font-medium text-text-secondary">Width</label>
Line  159: <span className="text-text-muted">×</span>
Line  167: <span className="text-sm text-text-muted">px</span>
Line  173: <label className="mb-2 block text-sm font-medium text-text-secondary">Height</label>
Line  198: <span className="text-text-muted">×</span>
... and 32 more
```

### 4. app/[locale]/(pseo)/\_components/tools/PrintCalculator.tsx (40 violations)

_Duplicate of #3_

### 5. app/(pseo)/\_components/tools/BulkImageCompressor.tsx (35 violations)

```
Line  308: <h2 className="text-2xl font-bold text-text-primary mb-2">Bulk Image Compressor</h2>
Line  309: <p className="text-text-secondary">Compress multiple images at once...</p>
Line  328: <h3 className="text-xl font-semibold text-text-primary mb-2">Upload Images</h3>
Line  331: <p className="text-text-secondary mb-4">Upload up to {MAX_IMAGES} images...</p>
Line  337: <button onClick={() => fileInputRef.current?.click()}>Choose Files</button>
Line  349: <button onClick={() => fileInputRef.current?.click()}>Choose Files</button>
Line  359: <label htmlFor="quality" className="text-sm font-medium text-text-secondary">Quality</label>
Line  387: <label htmlFor="targetSize" className="...">Target Size (KB)</label>
... and 27 more
```

### 6. app/[locale]/(pseo)/\_components/tools/BulkImageCompressor.tsx (35 violations)

_Duplicate of #5_

### 7. app/(pseo)/\_components/tools/BulkImageResizer.tsx (30 violations)

```
Line  424: <h3 className="text-lg font-semibold text-text-primary mb-4">Bulk Resize Settings</h3>
Line  431: <label htmlFor="width" className="mb-2 block text-sm font-medium text-text-secondary">Width</label>
Line  456: <div className="w-full px-3 py-2 border border-border rounded-lg bg-surface">...dimensions...</div>
Line  479: <label htmlFor="format" className="...">Output Format</label>
Line  495: <option value="webp">WebP</option>
Line  504: {options.quality}%</label>
Line  532: <label htmlFor="aspect-ratio" className="...">Aspect Ratio</label>
Line  543: <label htmlFor="fit-mode" className="...">Fit Mode</label>
... and 22 more
```

### 8. app/[locale]/(pseo)/\_components/tools/BulkImageResizer.tsx (30 violations)

_Duplicate of #7_

### 9. app/[locale]/dashboard/admin/users/[userId]/page.tsx (28 violations)

```
Line   84: <Link href="/dashboard/admin/users" className="...">Back to Users</Link>
Line   94: <p className="text-muted-foreground">User not found</p>
Line   98: <Link href="/dashboard/admin/users" className="...">Back to Users</Link>
Line  115: <h2 className="text-lg font-medium text-primary">User Details</h2>
Line  122: <h3 className="font-medium text-primary mb-4">Profile</h3>
Line  125: <dt className="text-sm text-muted-foreground">Email</dt>
Line  129: <dt className="text-sm text-muted-foreground">User ID</dt>
Line  133: <dt className="text-sm text-muted-foreground">Stripe Customer ID</dt>
... and 20 more
```

### 10. app/subscription/confirmed/page.tsx (26 violations)

```
Line  104: <p className="text-sm text-muted-foreground">{...subscription info...}</p>
Line  119: <p className="text-sm text-muted-foreground">{...renews info...}</p>
Line  133: <p className="font-medium text-primary">Keep your subscription active</p>
Line  134: <p className="font-medium text-primary">Keep your subscription active</p>
Line  145: <p className="font-medium text-primary">No charges today</p>
Line  146: <p className="text-sm text-muted-foreground">{...trial info...}</p>
... and 18 more
```

### 11. app/[locale]/dashboard/billing/page.tsx (24 violations)

```
Line  145: <button onClick={loadBillingData} className="...">Reload</button>
Line  196: <p className="text-sm text-muted-foreground">Credits balance</p>
Line  216: <button onClick={() => setShowCancelModal(true)} className="...">Cancel Plan</button>
Line  243: <strong>Trial Active:</strong>
Line  243: <p className="text-sm text-accent/80"><strong>Trial Active:</strong> ...</p>
Line  244: <p className="text-sm text-accent/80"><strong>Trial Active:</strong> ...</p>
Line  252: <p className="text-sm text-warning/80">Your subscription will expire...</p>
Line  264: <h4 className="font-medium text-white mb-1">Scheduled Plan Change</h4>
... and 16 more
```

### 12. app/(pseo)/\_components/tools/ImageCompressor.tsx (22 violations)

```
Line  124: <label className="text-sm font-medium mb-2 block text-muted-foreground">Image</label>
Line  144: <label className="text-sm font-medium mb-2 block text-muted-foreground">Quality</label>
Line  150: <p className="text-sm text-muted-foreground mt-2">Quality Setting</p>
Line  154: <p className="text-lg font-semibold text-success">{...estimated size...}</p>
Line  157: <p className="text-xs text-muted-foreground">{...reduction info...}</p>
Line  173: <label htmlFor="quality" className="text-sm font-medium text-muted-foreground">Quality</label>
Line  188: <span>Smaller file (lower quality)</span>
Line  189: <span>Larger file (higher quality)</span>
... and 14 more
```

### 13. app/[locale]/(pseo)/\_components/tools/ImageCompressor.tsx (22 violations)

_Duplicate of #12_

### 14. app/[locale]/checkout/page.tsx (19 violations)

```
Line  123: <h1 className="text-2xl font-bold text-primary mb-4">No Plan Selected</h1>
Line  124: <p className="text-muted-foreground mb-6">Please select a plan to continue...</p>
Line  130: <button onClick={handleGoBack} className="...">Go Back</button>
Line  146: <h1 className="text-xl font-semibold text-primary mb-2">Checking Auth...</h1>
Line  160: <h1 className="text-xl font-semibold text-primary mb-2">Authenticating...</h1>
Line  161: <p className="text-muted-foreground mb-6">Please sign in to continue...</p>
Line  167: <button onClick={() => router.push('/pricing')} className="...">View Pricing</button>
Line  199: <button onClick={handleGoBack} className="...">Go Back</button>
... and 11 more
```

### 15. client/components/admin/UserActionsDropdown.tsx (19 violations)

```
Line  176: <label className="block text-sm font-medium text-muted-foreground">New Profile Tier</label>
Line  181: <label className="block text-sm font-medium text-muted-foreground">Credits Adjustment</label>
Line  190: <p className="mt-1 text-sm text-muted-foreground">Current: {user.credits}</p>
Line  328: <label className="block text-sm font-medium text-muted-foreground">New Subscription Tier</label>
Line  335: <span className="text-muted-foreground">Profile Tier:</span>
Line  339: <span className="text-muted-foreground">Stripe Status:</span>
Line  348: <span className="text-muted-foreground">Renews:</span>
Line  360: <label className="block text-sm font-medium text-muted-foreground mb-2">Reason</label>
... and 11 more
```

### 16. app/[locale]/dashboard/admin/users/page.tsx (14 violations)

```
Line   59: <h2 className="text-lg font-medium text-primary">Users</h2>
Line   80: <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
Line   83: <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Credits</th>
Line   86: <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Profile Tier</th>
Line   89: <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Subscription</th>
Line   92: <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
Line   95: <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
Line  115: <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">No users found</td>
... and 6 more
```

### 17. client/components/stripe/SubscriptionStatus.tsx (14 violations)

```
Line   79: <h2 className="text-xl font-semibold mb-2">No Active Subscription</h2>
Line   80: <p className="text-muted-foreground mb-4">You don't have an active subscription...</p>
Line   87: <a href="/pricing" className="inline-flex items-center gap-2 ...">View Plans</a>
Line   99: <span className={`${baseClasses} bg-success/20 text-success`}>Active</span>
Line  101: <span className={`${baseClasses} bg-info/20 text-info`}>Trial</span>
Line  103: <span className={`${baseClasses} bg-warning/10 text-warning`}>Past Due</span>
Line  105: <span className={`${baseClasses} bg-error/10 text-error`}>Canceled</span>
Line  122: <h2 className="text-xl font-semibold">Subscription Status</h2>
... and 6 more
```

### 18. app/(pseo)/\_components/tools/ImageResizer.tsx (13 violations)

```
Line  205: <label className="text-sm font-medium mb-2 block text-muted-foreground">Image</label>
Line  225: <label className="text-sm font-medium mb-2 block text-muted-foreground">Resize Mode</label>
Line  233: <p className="text-sm text-muted-foreground mt-1">New dimensions</p>
Line  247: <label htmlFor="preset" className="...">Preset</label>
Line  269: <label htmlFor="format" className="...">Output Format</label>
Line  285: <option value="webp">WebP</option>
Line  294: <label htmlFor="width" className="mb-2 block text-sm font-medium text-muted-foreground">Width</label>
Line  313: <label htmlFor="height" className="mb-2 block text-sm font-medium text-muted-foreground">Height</label>
... and 5 more
```

### 19. app/[locale]/(pseo)/\_components/tools/ImageResizer.tsx (13 violations)

_Duplicate of #18_

### 20. client/components/features/workspace/BatchSidebar/CustomInstructionsModal.tsx (13 violations)

```
Line   95: <p className="font-medium mb-1">Custom AI Instructions</p>
Line   96: <p className="text-muted-foreground">Tell the AI exactly what to focus on...</p>
Line  108: <label htmlFor="custom-instructions-textarea" className="...">Your Instructions</label>
Line  128: <span className="text-muted-foreground">{characterCount} / {maxChars}</span>
Line  130: <span className="ml-2 text-error font-medium">({percent}%)</span>
Line  131: <span className="ml-2 text-error font-medium">({percent}%)</span>
Line  136: <span className="text-xs text-error">Character limit exceeded</span>
Line  143: <span className="text-sm font-medium text-muted-foreground">Quick Tips:</span>
... and 5 more
```

---

## Remaining Files with Violations

| File                                                                        | Violations |
| --------------------------------------------------------------------------- | ---------- |
| client/components/stripe/CreditHistory.tsx                                  | 12         |
| app/(pseo)/\_components/tools/FormatConverter.tsx                           | 11         |
| app/[locale]/(pseo)/\_components/tools/FormatConverter.tsx                  | 11         |
| client/components/features/image-processing/OversizedImageModal.tsx         | 11         |
| client/components/features/workspace/PreviewArea.tsx                        | 11         |
| app/[locale]/dashboard/admin/page.tsx                                       | 10         |
| client/components/features/workspace/Workspace.tsx                          | 10         |
| app/(pseo)/\_components/pseo/templates/ComparePageTemplate.tsx              | 9          |
| app/(pseo)/\_components/tools/BackgroundRemover.tsx                         | 9          |
| app/[locale]/(pseo)/\_components/pseo/templates/ComparePageTemplate.tsx     | 9          |
| app/[locale]/(pseo)/\_components/tools/BackgroundRemover.tsx                | 9          |
| app/[locale]/success/page.tsx                                               | 9          |
| client/components/features/workspace/BatchSidebar/EnhancementOptions.tsx    | 9          |
| app/(pseo)/\_components/pseo/templates/ScalePageTemplate.tsx                | 8          |
| app/[locale]/(pseo)/\_components/pseo/templates/ScalePageTemplate.tsx       | 8          |
| app/[locale]/blog/[slug]/page.tsx                                           | 8          |
| app/(pseo)/\_components/pseo/templates/FreePageTemplate.tsx                 | 7          |
| app/[locale]/(pseo)/\_components/pseo/templates/FreePageTemplate.tsx        | 7          |
| app/[locale]/canceled/page.tsx                                              | 7          |
| app/[locale]/verify-email/page.tsx                                          | 7          |
| client/components/features/workspace/BatchSidebar/ActionPanel.tsx           | 7          |
| client/components/features/workspace/BatchSidebar/QualityTierSelector.tsx   | 7          |
| client/components/stripe/CreditPackSelector.tsx                             | 7          |
| app/(pseo)/\_components/pseo/templates/GuidePageTemplate.tsx                | 6          |
| app/(pseo)/\_components/tools/SocialMediaSizeLookup.tsx                     | 6          |
| app/[locale]/(pseo)/\_components/pseo/templates/GuidePageTemplate.tsx       | 6          |
| app/[locale]/(pseo)/\_components/tools/SocialMediaSizeLookup.tsx            | 6          |
| app/[locale]/dashboard/admin/error.tsx                                      | 6          |
| app/[locale]/dashboard/error.tsx                                            | 6          |
| app/error.tsx                                                               | 6          |
| client/components/features/image-processing/FileSizeUpgradePrompt.tsx       | 6          |
| client/components/features/landing/Pricing.tsx                              | 6          |
| client/components/features/workspace/BatchSidebar.tsx                       | 6          |
| client/components/features/workspace/PremiumUpsellModal.tsx                 | 6          |
| client/components/features/image-processing/ImageComparison.tsx             | 5          |
| client/components/features/workspace/UpgradeSuccessBanner.tsx               | 5          |
| app/(pseo)/\_components/pseo/sections/HeroSection.tsx                       | 4          |
| app/(pseo)/compare/page.tsx                                                 | 4          |
| app/[locale]/(pseo)/\_components/pseo/sections/HeroSection.tsx              | 4          |
| app/[locale]/(pseo)/compare/page.tsx                                        | 4          |
| app/not-found.tsx                                                           | 4          |
| client/components/stripe/ExpirationWarningBanner.tsx                        | 4          |
| client/components/stripe/PlanComparisonCard.tsx                             | 4          |
| client/components/stripe/PricingCard.tsx                                    | 4          |
| app/(pseo)/\_components/pseo/sections/CTASection.tsx                        | 3          |
| app/(pseo)/\_components/tools/InteractiveTool.tsx                           | 3          |
| app/(pseo)/\_components/ui/FileUpload.tsx                                   | 3          |
| app/(pseo)/alternatives/page.tsx                                            | 3          |
| app/(pseo)/device-use/page.tsx                                              | 3          |
| app/(pseo)/format-scale/page.tsx                                            | 3          |
| app/(pseo)/formats/page.tsx                                                 | 3          |
| app/(pseo)/free/page.tsx                                                    | 3          |
| app/(pseo)/guides/page.tsx                                                  | 3          |
| app/(pseo)/platform-format/page.tsx                                         | 3          |
| app/(pseo)/scale/page.tsx                                                   | 3          |
| app/(pseo)/tools/page.tsx                                                   | 3          |
| app/(pseo)/use-cases/page.tsx                                               | 3          |
| app/[locale]/(pseo)/\_components/pseo/sections/CTASection.tsx               | 3          |
| app/[locale]/(pseo)/\_components/tools/InteractiveTool.tsx                  | 3          |
| app/[locale]/(pseo)/\_components/ui/FileUpload.tsx                          | 3          |
| app/[locale]/(pseo)/alternatives/page.tsx                                   | 3          |
| app/[locale]/(pseo)/device-use/page.tsx                                     | 3          |
| app/[locale]/(pseo)/format-scale/page.tsx                                   | 3          |
| app/[locale]/(pseo)/formats/page.tsx                                        | 3          |
| app/[locale]/(pseo)/free/page.tsx                                           | 3          |
| app/[locale]/(pseo)/guides/page.tsx                                         | 3          |
| app/[locale]/(pseo)/platform-format/page.tsx                                | 3          |
| app/[locale]/(pseo)/scale/page.tsx                                          | 3          |
| app/[locale]/(pseo)/tools/page.tsx                                          | 3          |
| app/[locale]/(pseo)/use-cases/page.tsx                                      | 3          |
| app/[locale]/auth/callback/page.tsx                                         | 3          |
| app/[locale]/blog/\_components/RelatedToolsSection.tsx                      | 3          |
| client/components/features/image-processing/Dropzone.tsx                    | 3          |
| client/components/features/workspace/BatchSidebar/FeatureToggles.tsx        | 3          |
| client/components/stripe/BillingErrorBoundary.tsx                           | 3          |
| client/components/stripe/CreditsDisplay.tsx                                 | 3          |
| app/(pseo)/\_components/pseo/sections/RelatedBlogPostsSection.tsx           | 2          |
| app/(pseo)/tools/resize/bulk-image-resizer/page.tsx                         | 2          |
| app/[locale]/(pseo)/\_components/pseo/sections/RelatedBlogPostsSection.tsx  | 2          |
| app/[locale]/(pseo)/\_components/pseo/templates/LocalizedPageTemplate.tsx   | 2          |
| app/[locale]/dashboard/admin/layout.tsx                                     | 2          |
| client/components/stripe/ProrationCard.tsx                                  | 2          |
| tests/unit/client/components/Pricing.test.tsx                               | 2          |
| app/(pseo)/\_components/pseo/sections/FAQSection.tsx                        | 1          |
| app/(pseo)/\_components/pseo/ui/StepCard.tsx                                | 1          |
| app/(pseo)/\_components/pseo/ui/UseCaseCard.tsx                             | 1          |
| app/[locale]/(pseo)/\_components/pseo/sections/FAQSection.tsx               | 1          |
| app/[locale]/(pseo)/\_components/pseo/ui/StepCard.tsx                       | 1          |
| app/[locale]/(pseo)/\_components/pseo/ui/UseCaseCard.tsx                    | 1          |
| app/[locale]/auth/confirm/page.tsx                                          | 1          |
| app/[locale]/help/HelpClient.tsx                                            | 1          |
| client/components/features/workspace/BatchSidebar/EnhancementPanel.tsx      | 1          |
| client/components/features/workspace/BatchSidebar/UpscaleFactorSelector.tsx | 1          |
| client/components/features/workspace/QueueStrip.tsx                         | 1          |
| client/components/form/SocialLoginButton.tsx                                | 1          |
| client/components/stripe/PricingCardSkeleton.tsx                            | 1          |

---

## Common Harcoded Strings by Pattern

### Trust Indicators

- "10 free credits"
- "Quick signup"
- "Instant results"
- "Free to start"
- "No watermarks"

### Form Labels

- "Width", "Height", "Quality", "Format"
- "Email", "Password", "Name"
- "Output", "Size", "px", "KB"

### Status Messages

- "No Active Subscription"
- "Trial Active", "Past Due", "Canceled"
- "User not found"
- "Loading..."

### Button Text

- "Choose Files", "Upload", "Download"
- "Go Back", "View Plans", "Cancel"
- "Submit", "Save", "Delete"

### Headings

- "Settings", "Options", "Details"
- "Overview", "Summary", "More Info"

---

## Key Observations

1. **Legal Pages** (`terms`, `privacy`) have the most violations (98, 89) - these are dense with text content that should be internationalized.

2. **Duplicate Files** - Many components exist in both `app/` and `app/[locale]/` paths, causing duplicate violation counts.

3. **Tool Components** - Many pSEO tool components have hardcoded labels, descriptions, and options like:
   - File format options: "WebP", "JPEG", "PNG"
   - Dimensions: "Width (pixels)", "Height (pixels)"
   - Quality settings: "Quality", "Target Size (KB)"
   - Units: "px", "KB"

4. **Admin/Dashboard** pages have significant hardcoded strings:
   - User profile fields: "Email", "User ID", "Stripe Customer ID"
   - Table headers: "Credits", "Profile Tier", "Subscription", "Status"
   - Status labels: "Active", "Trial", "Past Due", "Canceled"

5. **Common Patterns** - Trust indicators, CTA buttons, and status messages appear frequently across components.

---

## ESLint Rule Configuration

The violations are detected using the `eslint-plugin-i18next` rule:

```javascript
'i18next/no-literal-string': [
  'warn',
  {
    markupOnly: true,
    ignoreAttribute: [
      'data-testid', 'data-cy', 'className', 'style', 'type', 'id',
      'aria-label', 'placeholder', 'alt', 'key', 'name', 'role', 'src', 'href'
    ],
    ignoreTag: ['Styled', 'styled', 'Script', 'Link', 'Image'],
  }
]
```

---

## Next Steps

1. **Priority 1**: Fix legal pages (`terms`, `privacy`) - highest impact
2. **Priority 2**: Fix tool components with high violation counts
3. **Priority 3**: Fix admin/dashboard pages
4. **Priority 4**: Fix remaining pSEO templates and components

For each file:

1. Identify hardcoded strings
2. Add translation keys to `locales/en/common.json` (or appropriate namespace)
3. Translate keys to all other locales
4. Replace hardcoded strings with `useTranslations()` or `getTranslations()`
5. Run `yarn i18n:check` to verify

---

_Report generated from ESLint `i18next/no-literal-string` rule violations_
