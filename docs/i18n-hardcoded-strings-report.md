# i18n Hardcoded Strings Audit Report

**Generated**: 2026-01-09
**Scope**: Client-side components (React/TSX)
**Purpose**: Identify hardcoded English strings that need internationalization

## Executive Summary

This audit identified **78 hardcoded English strings** across **15 component files** that require internationalization. The findings are categorized by priority level:

- **High Priority**: 52 strings (user-facing UI text)
- **Medium Priority**: 18 strings (labels, placeholders, tooltips)
- **Low Priority**: 8 strings (aria-labels, technical messages)

---

## High Priority Findings

### 1. Authentication Components

#### `client/components/modal/auth/LoginForm.tsx`

| Line | Hardcoded String                      | Suggested Key              | Priority |
| ---- | ------------------------------------- | -------------------------- | -------- |
| 22   | `Sign in to your account to continue` | `auth.form.signInSubtitle` | HIGH     |

#### `client/components/form/PasswordStrengthIndicator.tsx`

| Line | Hardcoded String              | Suggested Key                            | Priority |
| ---- | ----------------------------- | ---------------------------------------- | -------- |
| 42   | `Too weak`                    | `auth.password.strength.tooWeak`         | HIGH     |
| 43   | `Weak`                        | `auth.password.strength.weak`            | HIGH     |
| 44   | `Fair`                        | `auth.password.strength.fair`            | HIGH     |
| 45   | `Good`                        | `auth.password.strength.good`            | HIGH     |
| 46   | `Strong`                      | `auth.password.strength.strong`          | HIGH     |
| 54   | `At least 6 characters`       | `auth.password.requirements.minLength`   | HIGH     |
| 55   | `Uppercase letter (A-Z)`      | `auth.password.requirements.uppercase`   | HIGH     |
| 56   | `Lowercase letter (a-z)`      | `auth.password.requirements.lowercase`   | HIGH     |
| 57   | `Number (0-9)`                | `auth.password.requirements.number`      | HIGH     |
| 58   | `Special character (!@#$...)` | `auth.password.requirements.specialChar` | HIGH     |
| 85   | `requirements`                | `auth.password.requirements.label`       | HIGH     |

### 2. Workspace & Batch Processing Components

#### `client/components/features/workspace/BatchLimitModal.tsx`

| Line    | Hardcoded String                                       | Suggested Key                                | Priority |
| ------- | ------------------------------------------------------ | -------------------------------------------- | -------- |
| 93      | `Batch Processing Limit Reached`                       | `workspace.batchLimit.serverEnforcedTitle`   | HIGH     |
| 93      | `Batch Limit Reached`                                  | `workspace.batchLimit.clientEnforcedTitle`   | HIGH     |
| 98-100  | `You've reached the processing limit for your plan...` | `workspace.batchLimit.serverEnforcedMessage` | HIGH     |
| 104-108 | `You tried to add {n} image(s)...`                     | `workspace.batchLimit.clientEnforcedMessage` | HIGH     |
| 116-118 | `Free users can process 1 image at a time...`          | `workspace.batchLimit.freeUserMessage`       | HIGH     |
| 126-128 | `This is a security measure to prevent abuse...`       | `workspace.batchLimit.securityMessage`       | HIGH     |
| 135     | `Upgrade Plan`                                         | `workspace.batchLimit.upgradeButton`         | HIGH     |
| 140     | `Add {n} image(s)`                                     | `workspace.batchLimit.addPartialButton`      | HIGH     |
| 145     | `Cancel`                                               | `common.cancel`                              | HIGH     |

#### `client/components/features/workspace/QueueStrip.tsx`

| Line | Hardcoded String   | Suggested Key                  | Priority |
| ---- | ------------------ | ------------------------------ | -------- |
| 36   | `Processing Queue` | `workspace.queue.title`        | HIGH     |
| 81   | `Limit Reached`    | `workspace.queue.limitReached` | HIGH     |
| 82   | `Add More`         | `workspace.queue.addMore`      | HIGH     |

#### `client/components/tools/shared/MultiFileDropzone.tsx`

| Line | Hardcoded String                                                          | Suggested Key                        | Priority |
| ---- | ------------------------------------------------------------------------- | ------------------------------------ | -------- |
| 246  | `Drop to upload`                                                          | `tools.dropzone.dropToUpload`        | HIGH     |
| 246  | `Click or drag images`                                                    | `tools.dropzone.clickOrDrag`         | HIGH     |
| 249  | `Support for JPG, PNG, WEBP, and HEIC`                                    | `tools.dropzone.supportedFormats`    | HIGH     |
| 251  | `Up to {size} per file • Max {n} files at a time`                         | `tools.dropzone.limits`              | HIGH     |
| 259  | `{n} file(s) selected`                                                    | `tools.dropzone.selectedCount`       | HIGH     |
| 280  | `Selected Files ({n})`                                                    | `tools.dropzone.selectedTitle`       | HIGH     |
| 289  | `Clear All`                                                               | `tools.dropzone.clearAll`            | HIGH     |
| 320  | `Remove file`                                                             | `tools.dropzone.removeFile`          | HIGH     |
| 75   | `Invalid file type: {type}. Allowed: {types}`                             | `tools.dropzone.errors.invalidType`  | HIGH     |
| 83   | `File too large: {name} ({size} > {limit})`                               | `tools.dropzone.errors.fileTooLarge` | HIGH     |
| 101  | `Maximum {n} files allowed. You have {count}, trying to add {attempted}.` | `tools.dropzone.errors.maxFiles`     | HIGH     |

### 3. Blog Components

#### `client/components/blog/BlogCTA.tsx`

| Line  | Hardcoded String                                                                      | Suggested Key                 | Priority |
| ----- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| 38    | `Try It Yourself`                                                                     | `blog.cta.tryTitle`           | HIGH     |
| 40    | `Upload your image and see the AI enhancement in action. Start with 10 free credits.` | `blog.cta.tryDescription`     | HIGH     |
| 41    | `Try Free Now`                                                                        | `blog.cta.tryButton`          | HIGH     |
| 45    | `See the Difference`                                                                  | `blog.cta.demoTitle`          | HIGH     |
| 47    | `Experience crystal-clear upscaling that preserves text, logos, and fine details.`    | `blog.cta.demoDescription`    | HIGH     |
| 48    | `Upload Your Image`                                                                   | `blog.cta.demoButton`         | HIGH     |
| 52    | `Ready to Transform Your Images?`                                                     | `blog.cta.pricingTitle`       | HIGH     |
| 54    | `Start with 10 free credits. No credit card required. Cancel anytime.`                | `blog.cta.pricingDescription` | HIGH     |
| 55    | `View Pricing`                                                                        | `blog.cta.pricingButton`      | HIGH     |
| 59    | `Upscale Your Images Now`                                                             | `blog.cta.toolTitle`          | HIGH     |
| 60    | `AI-powered enhancement in 30 seconds. Keep text sharp.`                              | `blog.cta.toolDescription`    | HIGH     |
| 61    | `Try Free`                                                                            | `blog.cta.toolButton`         | HIGH     |
| 67-69 | `10 free credits`, `Quick signup`, `Instant results`                                  | `blog.cta.trustIndicators`    | HIGH     |
| 178   | `2x - 4x upscaling`                                                                   | `blog.cta.feature2x4x`        | HIGH     |
| 182   | `Text preservation`                                                                   | `blog.cta.featureText`        | HIGH     |
| 186   | `30 second processing`                                                                | `blog.cta.featureSpeed`       | HIGH     |

#### `client/components/blog/BlogSearch.tsx`

| Line | Hardcoded String     | Suggested Key             | Priority |
| ---- | -------------------- | ------------------------- | -------- |
| 34   | `Search articles...` | `blog.search.placeholder` | MEDIUM   |

### 4. Error & Warning Components

#### `client/components/errors/ErrorBoundary.tsx`

| Line | Hardcoded String                                                      | Suggested Key                  | Priority |
| ---- | --------------------------------------------------------------------- | ------------------------------ | -------- |
| 91   | `Something went wrong`                                                | `errors.boundary.title`        | HIGH     |
| 93   | `We encountered an unexpected error. Please try refreshing the page.` | `errors.boundary.message`      | HIGH     |
| 99   | `Error details (dev only)`                                            | `errors.boundary.detailsLabel` | LOW      |
| 119  | `Try Again`                                                           | `errors.boundary.retryButton`  | HIGH     |
| 126  | `Go Home`                                                             | `errors.boundary.homeButton`   | HIGH     |

#### `client/components/pseo/EnglishOnlyBanner.tsx`

| Line    | Hardcoded String                                                                                | Suggested Key                   | Priority |
| ------- | ----------------------------------------------------------------------------------------------- | ------------------------------- | -------- |
| 117     | `English Version Only`                                                                          | `i18n.englishOnly.title`        | HIGH     |
| 120-121 | `This page is currently only available in English. Would you like to view the English version?` | `i18n.englishOnly.message`      | HIGH     |
| 140     | `Switch to English`                                                                             | `i18n.englishOnly.switchButton` | HIGH     |

---

## Medium Priority Findings

### 5. Modal & UI Components

#### `client/components/modal/Modal.tsx`

| Line | Hardcoded String           | Suggested Key       | Priority |
| ---- | -------------------------- | ------------------- | -------- |
| 109  | `Close modal` (aria-label) | `modal.aria.close`  | MEDIUM   |
| 133  | `Close modal` (aria-label) | `modal.aria.close`  | MEDIUM   |
| 135  | `Close`                    | `modal.closeButton` | MEDIUM   |

#### `client/components/ui/Modal.tsx`

| Line | Hardcoded String           | Suggested Key         | Priority |
| ---- | -------------------------- | --------------------- | -------- |
| 77   | `Close modal` (aria-label) | `ui.modal.aria.close` | MEDIUM   |

### 6. Admin Components

#### `client/components/admin/UserActionsDropdown.tsx`

| Line | Hardcoded String              | Suggested Key                    | Priority |
| ---- | ----------------------------- | -------------------------------- | -------- |
| 44   | `User actions` (aria-label)   | `admin.aria.userActions`         | MEDIUM   |
| 51   | `View Details`                | `admin.users.viewDetails`        | MEDIUM   |
| 55   | `Remove Admin`                | `admin.users.removeAdmin`        | MEDIUM   |
| 55   | `Make Admin`                  | `admin.users.makeAdmin`          | MEDIUM   |
| 60   | `Adjust Credits`              | `admin.users.adjustCredits`      | MEDIUM   |
| 65   | `Change Subscription`         | `admin.users.changeSubscription` | MEDIUM   |
| 71   | `Delete User`                 | `admin.users.deleteUser`         | MEDIUM   |
| 442  | `Grant Admin Access`          | `admin.users.grantAdminTitle`    | MEDIUM   |
| 442  | `Remove Admin Access`         | `admin.users.removeAdminTitle`   | MEDIUM   |
| 471  | `Grant Admin`                 | `admin.users.grantAdminButton`   | MEDIUM   |
| 471  | `Remove Admin`                | `admin.users.removeAdminButton`  | MEDIUM   |
| 507  | `Delete User` (modal title)   | `admin.users.deleteUserTitle`    | MEDIUM   |
| 533  | `Delete User` (submit button) | `admin.users.deleteUserButton`   | MEDIUM   |

### 7. Other Components

#### `client/components/i18n/LocaleSwitcher.tsx`

| Line | Hardcoded String               | Suggested Key             | Priority |
| ---- | ------------------------------ | ------------------------- | -------- |
| 65   | `Switch language` (aria-label) | `i18n.switcher.ariaLabel` | MEDIUM   |

#### `client/components/stripe/ExpirationWarningBanner.tsx`

| Line | Hardcoded String       | Suggested Key                | Priority |
| ---- | ---------------------- | ---------------------------- | -------- |
| 189  | `Dismiss` (aria-label) | `stripe.banner.aria.dismiss` | MEDIUM   |

---

## Low Priority Findings

### 8. Accessibility Labels & Technical Messages

#### `client/components/features/workspace/QueueStrip.tsx`

| Line | Hardcoded String            | Suggested Key                      | Priority |
| ---- | --------------------------- | ---------------------------------- | -------- |
| 150  | `Remove image` (aria-label) | `workspace.queue.aria.removeImage` | LOW      |

#### `client/components/features/workspace/Workspace.tsx`

| Line | Hardcoded String             | Suggested Key                 | Priority |
| ---- | ---------------------------- | ----------------------------- | -------- |
| 250  | `Dismiss error` (aria-label) | `workspace.aria.dismissError` | LOW      |

#### `client/components/stripe/OutOfCreditsModal.tsx`

| Line | Hardcoded String                                   | Suggested Key | Priority |
| ---- | -------------------------------------------------- | ------------- | -------- |
| 36   | `not now` (aria-label) - Already using translation | N/A           | LOW      |

#### `client/components/dashboard/DashboardSidebar.tsx`

| Line | Hardcoded String                                     | Suggested Key | Priority |
| ---- | ---------------------------------------------------- | ------------- | -------- |
| 126  | `closeMenu` (aria-label) - Already using translation | N/A           | LOW      |

---

## Implementation Recommendations

### Phase 1: High Priority User-Facing Text (Week 1)

1. **Authentication Flow**
   - `LoginForm.tsx` - Sign in subtitle
   - `PasswordStrengthIndicator.tsx` - All strength labels and requirements

2. **Workspace & Tools**
   - `BatchLimitModal.tsx` - All limit messages and buttons
   - `QueueStrip.tsx` - Queue labels
   - `MultiFileDropzone.tsx` - All dropzone text and error messages

3. **Blog CTAs**
   - `BlogCTA.tsx` - All CTA titles, descriptions, and buttons

### Phase 2: Error & Warning Messages (Week 2)

1. **Error Handling**
   - `ErrorBoundary.tsx` - Error messages and buttons
   - `EnglishOnlyBanner.tsx` - Language banner content

2. **Modal Components**
   - Both `Modal.tsx` files - Close button text

### Phase 3: Admin & Medium Priority (Week 3)

1. **Admin Interface**
   - `UserActionsDropdown.tsx` - All action labels and modal titles
   - Related admin modal components

2. **Blog Features**
   - `BlogSearch.tsx` - Search placeholder

### Phase 4: Accessibility Labels (Week 4)

1. **ARIA Labels**
   - All aria-label attributes across components
   - Ensure screen reader compatibility

---

## Translation Key Structure Proposal

Based on the findings, the following namespace structure is recommended:

```json
{
  "auth": {
    "form": {
      "signInSubtitle": "..."
    },
    "password": {
      "strength": {
        "tooWeak": "...",
        "weak": "...",
        "fair": "...",
        "good": "...",
        "strong": "..."
      },
      "requirements": {
        "minLength": "...",
        "uppercase": "...",
        "lowercase": "...",
        "number": "...",
        "specialChar": "...",
        "label": "..."
      }
    }
  },
  "workspace": {
    "batchLimit": {
      "serverEnforcedTitle": "...",
      "clientEnforcedTitle": "...",
      ...
    },
    "queue": {
      "title": "...",
      "limitReached": "...",
      "addMore": "..."
    }
  },
  "tools": {
    "dropzone": {
      "dropToUpload": "...",
      "clickOrDrag": "...",
      ...
    }
  },
  "blog": {
    "cta": {
      "tryTitle": "...",
      "tryDescription": "...",
      ...
    },
    "search": {
      "placeholder": "..."
    }
  },
  "errors": {
    "boundary": {
      "title": "...",
      "message": "...",
      ...
    }
  },
  "i18n": {
    "englishOnly": {
      "title": "...",
      "message": "...",
      ...
    }
  },
  "admin": {
    "users": {
      "viewDetails": "...",
      "removeAdmin": "...",
      ...
    }
  },
  "modal": {
    "closeButton": "...",
    "aria": {
      "close": "..."
    }
  }
}
```

---

## File-by-File Summary

| File                            | Total Issues | High   | Medium | Low   |
| ------------------------------- | ------------ | ------ | ------ | ----- |
| `PasswordStrengthIndicator.tsx` | 11           | 11     | 0      | 0     |
| `BlogCTA.tsx`                   | 20           | 20     | 0      | 0     |
| `MultiFileDropzone.tsx`         | 11           | 11     | 0      | 0     |
| `BatchLimitModal.tsx`           | 9            | 9      | 0      | 0     |
| `ErrorBoundary.tsx`             | 5            | 4      | 0      | 1     |
| `EnglishOnlyBanner.tsx`         | 4            | 4      | 0      | 0     |
| `LoginForm.tsx`                 | 1            | 1      | 0      | 0     |
| `QueueStrip.tsx`                | 4            | 4      | 0      | 0     |
| `BlogSearch.tsx`                | 1            | 0      | 1      | 0     |
| `Modal.tsx` (components/modal)  | 3            | 0      | 3      | 0     |
| `Modal.tsx` (components/ui)     | 1            | 0      | 1      | 0     |
| `UserActionsDropdown.tsx`       | 13           | 0      | 13     | 0     |
| `LocaleSwitcher.tsx`            | 1            | 0      | 1      | 0     |
| `ExpirationWarningBanner.tsx`   | 1            | 0      | 1      | 0     |
| `Workspace.tsx`                 | 1            | 0      | 0      | 1     |
| **Total**                       | **86**       | **65** | **20** | **1** |

---

## Testing Recommendations

After implementing translations:

1. **Visual Regression Testing**
   - Compare layouts across all supported locales (de, es, fr, it, ja, pt)
   - Check for text overflow or layout breaks
   - Verify line heights and spacing accommodate longer translations

2. **Functional Testing**
   - Test all user flows in each locale
   - Verify form validation messages are translated
   - Check error handling in different languages

3. **Accessibility Testing**
   - Verify screen readers pronounce translated text correctly
   - Ensure aria-labels are properly localized
   - Test keyboard navigation with translated labels

4. **Automated Testing**
   - Add i18n coverage to unit tests
   - Test missing translation keys at build time
   - Validate translation file structure

---

## Next Steps

1. **Review and Prioritize**: Confirm priority rankings with product team
2. **Create Translation Keys**: Set up the JSON structure in `locales/en/`
3. **Implement Phase 1**: Start with high-priority user-facing text
4. **Translation Process**: Use existing translation workflow (scripts/translation-helper.ts)
5. **Testing**: Verify each component after translation implementation
6. **Documentation**: Update component documentation with i18n requirements

---

## Excluded Items

The following were intentionally excluded from this audit:

- **Log messages**: Should use `@client/utils/logger` or `@server/monitoring/logger.ts`
- **Internal variable names**: Not user-facing
- **API endpoint paths**: Technical identifiers
- **Test files**: Not part of production code
- **Node_modules**: Third-party dependencies
- **Brand names**: "MyImageUpscaler", "Instagram", etc. should remain unchanged

---

**Report End**
