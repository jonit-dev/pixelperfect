# Security Audit Report

**Date:** 2026-01-15
**Audited By:** Claude Code (Automated Bug Hunter Agents)
**Scope:** Full codebase security audit covering authentication, payments, APIs, file uploads, credit system, and client-side code

---

## Executive Summary

This audit identified **6 Critical**, **6 High**, **12 Medium**, and several Low severity issues across the codebase. The most severe issues involve credit system permission misconfigurations that could allow users to manipulate other users' credits, and authentication bypass vectors.

### Severity Distribution

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 6 | Requires immediate fix |
| High | 6 | Fix within 1 week |
| Medium | 12 | Fix within 2 weeks |
| Low | 8 | Address when possible |

---

## Critical Severity Issues

### 1. `consume_credits_v2` Granted to `authenticated` Role

**File:** `supabase/migrations/20251205_update_credit_rpcs.sql`
**Lines:** 185-186

```sql
GRANT EXECUTE ON FUNCTION consume_credits_v2(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credits_v2(UUID, INTEGER, TEXT, TEXT) TO service_role;
```

**Issue:** While other credit-modifying RPCs were correctly revoked from the `authenticated` role in migration `20250303_revoke_credit_rpc_from_authenticated.sql`, the newer `consume_credits_v2` function is still granted to authenticated users.

**Exploit Vector:** An authenticated user could call `consume_credits_v2` with `target_user_id` set to another user's UUID, potentially draining their credits.

**Impact:** Cross-user credit manipulation, financial loss

**Recommended Fix:**
```sql
REVOKE EXECUTE ON FUNCTION public.consume_credits_v2(UUID, INTEGER, TEXT, TEXT) FROM authenticated;
```

---

### 2. `admin_adjust_credits` References Deprecated Column

**File:** `supabase/migrations/20250302_fix_admin_adjust_credits.sql`
**Lines:** 33-38

```sql
UPDATE profiles
SET credits_balance = credits_balance + adjustment_amount,
    updated_at = NOW()
WHERE id = target_user_id
RETURNING credits_balance INTO new_balance;
```

**Issue:** The `admin_adjust_credits` function references the old `credits_balance` column, but the schema was migrated to dual-pool (`subscription_credits_balance` + `purchased_credits_balance`) in migration `20251205_separate_credit_pools.sql`.

**Impact:** Admin credit adjustments will fail or update a non-existent column, causing data corruption or silent failures.

**Recommended Fix:** Update function to work with dual-pool schema.

---

### 3. X-User-Id Header Trust Without JWT Verification

**File:** `server/middleware/requireAdmin.ts`
**Lines:** 17-31

```typescript
export async function requireAdmin(req: NextRequest): Promise<IAdminCheckResult> {
  // Try to get user ID from middleware header first (if middleware is enabled)
  let userId = req.headers.get('X-User-Id');

  // If no header, extract user from JWT token directly
  if (!userId) {
    const authResult = await verifyApiAuth(req);
    // ...
  }
```

**Issue:** The `requireAdmin` function trusts the `X-User-Id` header without verifying it came from the middleware. If an attacker can bypass middleware or send a direct request with a forged `X-User-Id` header, they could impersonate any user including admins.

**Impact:** Privilege escalation, unauthorized admin access

**Recommended Fix:** Always verify the JWT token directly within `requireAdmin` rather than trusting headers.

---

### 4. Missing UUID Validation in Admin Users Route

**File:** `app/api/admin/users/[userId]/route.ts`
**Lines:** 5-9, 48-52, 93-100

```typescript
const { userId } = await params;
// userId used directly without validation
```

**Issue:** The `userId` path parameter is not validated as a UUID before being used in database queries.

**Impact:** IDOR (Insecure Direct Object Reference) - potential access/modification of unintended records.

**Recommended Fix:**
```typescript
import { z } from 'zod';
const userIdSchema = z.string().uuid();
const validatedUserId = userIdSchema.parse(userId);
```

---

### 5. Missing Input Validation on Admin PATCH Endpoint

**File:** `app/api/admin/users/[userId]/route.ts`
**Lines:** 54-63

```typescript
const body = await req.json();
const allowedFields = ['role', 'subscription_tier', 'subscription_status'];

for (const field of allowedFields) {
  if (body[field] !== undefined) {
    updates[field] = body[field];  // Could be any type!
  }
}
```

**Issue:** The PATCH endpoint accepts request body without Zod validation. While it has an allowlist for fields, the values are not validated.

**Impact:** Injection of unexpected values (objects, arrays, SQL payloads) into profile fields.

**Recommended Fix:**
```typescript
const updateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  subscription_tier: z.enum(['hobby', 'pro', 'business']).optional(),
  subscription_status: z.enum(['active', 'canceled', 'trialing']).optional(),
});
const validatedBody = updateSchema.parse(body);
```

---

### 6. Missing Request Body Validation on Subscription Change

**File:** `app/api/subscription/change/route.ts`
**Lines:** 87-101

**File:** `app/api/subscription/preview-change/route.ts`
**Lines:** 111-126

```typescript
const text = await request.text();
body = JSON.parse(text) as ISubscriptionChangeRequest;
```

**Issue:** Request body is parsed with `JSON.parse()` and cast directly to interface type without Zod validation.

**Impact:** Malformed payloads could bypass type safety, causing unexpected behavior or information leakage.

**Recommended Fix:**
```typescript
const subscriptionChangeSchema = z.object({
  targetPriceId: z.string().startsWith('price_').min(10),
});
const validatedBody = subscriptionChangeSchema.parse(JSON.parse(text));
```

---

## High Severity Issues

### 7. Potential Double Credit Addition on Checkout + Invoice Webhooks

**File:** `app/api/webhooks/stripe/handlers/payment.handler.ts`
**Lines:** 74-125

**File:** `app/api/webhooks/stripe/handlers/invoice.handler.ts`
**Lines:** 229-234

**Issue:** When a user completes checkout for a subscription:
1. `checkout.session.completed` adds initial credits with `ref_id: session_*`
2. `invoice.payment_succeeded` also adds credits with `ref_id: invoice_*`

Both use different `ref_id` formats, so idempotency by transaction reference won't prevent duplicate credits.

**Impact:** Users could receive double credits on initial subscription.

**Recommended Fix:**
- Add check in invoice handler to skip first invoice if checkout session already granted credits
- Or remove credit allocation from `checkout.session.completed` entirely

---

### 8. Batch Limit TOCTOU Race Condition

**File:** `server/services/batch-limit.service.ts`
**Lines:** 44-91

**File:** `app/api/upscale/route.ts`
**Lines:** 216-244 (check) and 624 (increment)

**Issue:** Batch limit is checked early in request handler but only incremented after successful processing. Multiple concurrent requests could all pass the check before any increments occur.

**Exploit Vector:** User on free tier (limit: 1) fires 10 concurrent requests; all 10 pass batch check.

**Impact:** Batch limit bypass through concurrent requests.

**Recommended Fix:** Make check and increment atomic, or use database-backed counter with row locking.

---

### 9. In-Memory Batch Limits Lost on Server Restart

**File:** `server/services/batch-limit.service.ts`
**Lines:** 19-20

```typescript
const batchStore = new Map<string, IBatchEntry>();
```

**Issue:** Batch limits stored in-memory only. Lost on server restart or across Cloudflare Workers instances.

**Impact:** Batch limit bypass in production.

**Recommended Fix:** Use Redis or database-backed persistent storage.

---

### 10. Unbounded Pagination Parameters

**File:** `app/api/credits/history/route.ts`
**Lines:** 35-37

```typescript
const limit = parseInt(searchParams.get('limit') || '50', 10);
const offset = parseInt(searchParams.get('offset') || '0', 10);
```

**Issue:** No upper bound on limit parameter.

**Impact:** DoS through `?limit=999999999` causing database/memory exhaustion.

**Recommended Fix:**
```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
```

---

### 11. Unbounded listUsers and Client-Side Search

**File:** `app/api/admin/users/route.ts`
**Lines:** 36, 53-58

```typescript
const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
// Then client-side filtering
```

**Issue:** Fetches ALL auth users without pagination, then filters client-side.

**Impact:** Performance degradation and DoS as user base grows. Exposes all user emails in memory.

**Recommended Fix:** Use Supabase pagination and server-side search.

---

### 12. Test Authentication Bypass in Production Risk

**File:** `lib/middleware/auth.ts`
**Lines:** 97-129

```typescript
if (serverEnv.ENV === 'test') {
  if (token === 'test_auth_token_for_testing_only') {
    return { user: { id: 'test-user-id-12345', email: 'test@example.com' } };
  }
}
```

**Issue:** Test authentication relies entirely on `ENV` variable. If misconfigured to 'test' in production, attackers could bypass authentication.

**Impact:** Complete authentication bypass if ENV misconfigured.

**Recommended Fix:** Add multiple safeguards (hostname check, deployment context), log warnings when test mode detected.

---

## Medium Severity Issues

### 13. Missing Positive Amount Validation in clawback_credits_v2

**File:** `supabase/migrations/20251229_fix_credit_clawback.sql`
**Lines:** 69-158

**Issue:** Function does not validate that `p_amount` is positive. Negative amount could add credits.

**Recommended Fix:**
```sql
IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Clawback amount must be positive: %', p_amount;
END IF;
```

---

### 14. Credit Pack Credits Trusted From Session Metadata

**File:** `app/api/webhooks/stripe/handlers/payment.handler.ts`
**Lines:** 164-170

```typescript
const credits = parseInt(session.metadata?.credits || '0', 10);
```

**Issue:** Credits count read from metadata without server-side verification against price configuration.

**Recommended Fix:** Re-resolve credit amount from price ID in webhook handler.

---

### 15. Missing Refund Pool Tracking

**File:** `server/services/replicate.service.ts`
**Lines:** 255-265

**Issue:** `refund_credits` function doesn't track which credit pool the original deduction came from.

**Impact:** Refunds may go to wrong pool (subscription vs purchased).

---

### 16. Open Redirect Potential in Portal Route

**File:** `app/api/portal/route.ts`
**Lines:** 86-142

**Issue:** `returnUrl` validated for protocol but not domain. Could redirect to phishing sites.

**Recommended Fix:**
```typescript
const allowedDomains = [clientEnv.BASE_URL, 'localhost:3000'];
if (!allowedDomains.some(d => url.hostname.includes(d))) {
  return NextResponse.json({ error: 'Invalid return URL domain' }, { status: 400 });
}
```

---

### 17. XSS via JSON-LD Script Injection

**File:** `client/components/seo/JsonLd.tsx`
**Line:** 9

```typescript
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
```

**Issue:** `JSON.stringify()` does not escape `</script>` sequence. If user-controlled data contains this, it could break out of script tag.

**Recommended Fix:**
```typescript
JSON.stringify(data).replace(/<\/script/gi, '<\\/script')
```

---

### 18. SSR Markdown Without Sanitization

**File:** `app/(pseo)/_components/pseo/ui/MarkdownRenderer.tsx`
**Lines:** 36-38

```typescript
const html = DOMPurify ? DOMPurify.sanitize(parsedMarkdown) : parsedMarkdown;
```

**Issue:** During SSR, `DOMPurify` is null, so markdown rendered without sanitization.

**Recommended Fix:** Use isomorphic sanitization library like `isomorphic-dompurify`.

---

### 19. Insecure Locale Cookie Configuration

**File:** `middleware.ts`
**Lines:** 267-270, 285-289

```typescript
response.cookies.set(LOCALE_COOKIE, detectedLocale, {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
});
```

**Issue:** Locale cookie set without `Secure` flag.

**Recommended Fix:** Add `secure: true` in production environments.

---

### 20. Test Authentication Bypass in Client Bundle

**File:** `client/utils/api-client.ts`
**Lines:** 188-200

```typescript
const isTestEnvironment =
  window.__TEST_ENV__ === true || window.playwrightTest === true;

if (!accessToken && !isTestEnvironment) {
  throw new Error('You must be logged in to process images');
}
```

**Issue:** Attacker could set `window.__TEST_ENV__ = true` in console to bypass client-side auth check.

**Recommended Fix:** Remove client-side test bypass entirely; server enforces auth properly.

---

### 21. Rate Limit Bypass via Test Environment Detection

**File:** `lib/middleware/rateLimit.ts`
**Lines:** 53-63

```typescript
export function isTestEnvironment(): boolean {
  return serverEnv.ENV === 'test' ||
         serverEnv.STRIPE_SECRET_KEY?.startsWith('sk_test_');
}
```

**Issue:** Rate limiting disabled if Stripe key is test key. Staging environments using test Stripe keys would have no rate limiting.

**Recommended Fix:** Only disable rate limiting based on explicit test flags, not inferred from service keys.

---

### 22. Public is_admin Function Exposure

**File:** `supabase/migrations/20250203_fix_admin_policy_recursion.sql`
**Lines:** 7-21

```sql
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
```

**Issue:** Any authenticated user can query whether any other user is an admin.

**Impact:** Information disclosure about admin users.

---

### 23. Subscription Upgrade Does Not Cap to maxRollover

**File:** `server/services/SubscriptionCredits.ts`
**Lines:** 39-62

**Issue:** When upgrading, tier difference is always added without checking if result exceeds `maxRollover` cap.

---

### 24. Idempotency Check Race Condition

**File:** `app/api/webhooks/stripe/services/idempotency.service.ts`
**Lines:** 14-46

**Issue:** SELECT then INSERT pattern has TOCTOU race. Should use `INSERT ... ON CONFLICT`.

---

## Low Severity Issues

### 25. Silent Refund Failures

**File:** `server/services/replicate.service.ts`
**Lines:** 262-264

**Issue:** Refund failures only logged, not tracked/alerted.

---

### 26. Missing dispute_events Table Check

**File:** `app/api/webhooks/stripe/handlers/dispute.handler.ts`
**Lines:** 88-100

**Issue:** Inserts to `dispute_events` without checking table exists; error swallowed.

---

### 27. Scheduled Downgrade Uses Direct Update

**File:** `app/api/webhooks/stripe/handlers/subscription.handler.ts`
**Lines:** 752-757

**Issue:** Direct UPDATE bypasses transaction logging for scheduled downgrades.

---

### 28. Profile Not Found Handling Inconsistency

**Multiple Files:** Various webhook handlers

**Issue:** Inconsistent error handling when profile not found - some throw, some return.

---

### 29. Clawback Reference Mismatch

**File:** `app/api/webhooks/stripe/handlers/payment.handler.ts`
**Lines:** 250-254

**Issue:** Refund handler reference ID formats may not match original transaction.

---

### 30. Server Import in Client Code

**File:** `client/services/stripeService.ts`
**Line:** 7

**Issue:** Imports from `@server/` path in client code (though content is browser-safe).

---

### 31. serverEnv Import in Client Code

**File:** `client/utils/api-client.ts`
**Line:** 2

**Issue:** Imports `serverEnv` in client code (only uses non-secret value).

---

### 32. Free Tier Abuse via Account Creation

**File:** `shared/config/subscription.config.ts`
**Lines:** 278-284

**Issue:** No mechanism to prevent multiple account creation for repeated free credits.

---

## Positive Security Findings

The codebase demonstrates several good security practices:

1. **Trigger Protection:** `prevent_credit_update` trigger blocks direct balance updates
2. **Row Locking:** `FOR UPDATE` used in credit RPCs for atomicity
3. **Webhook Signature Verification:** Proper Stripe signature verification
4. **Webhook Idempotency:** Events tracked in `webhook_events` table
5. **Price ID Validation:** All price IDs validated via `assertKnownPriceId()`
6. **FIFO Credit Consumption:** Subscription credits consumed before purchased
7. **Magic Byte Validation:** File types verified by actual content, not just MIME
8. **Security Headers:** Comprehensive CSP, X-Frame-Options, etc.
9. **Environment Variable Handling:** Typed configs with Zod validation
10. **CORS Configuration:** Properly restricts origins, no wildcard
11. **SSRF Protection:** Proxy-image has domain allowlist with subdomain check
12. **Open Redirect Protection:** Same-origin validation in auth redirect manager

---

## Recommended Fix Priority

### P0 - Fix Immediately (Critical)

| # | Issue | File | Action |
|---|-------|------|--------|
| 1 | consume_credits_v2 permission | migrations | Revoke from authenticated |
| 2 | admin_adjust_credits broken | migrations | Update for dual-pool |
| 3 | X-User-Id header trust | requireAdmin.ts | Always verify JWT |
| 4 | Admin UUID validation | admin/users/[userId] | Add Zod UUID schema |
| 5 | Admin PATCH validation | admin/users/[userId] | Add Zod body schema |
| 6 | Subscription change validation | subscription/change | Add Zod schema |

### P1 - Fix Within 1 Week (High)

| # | Issue | File | Action |
|---|-------|------|--------|
| 7 | Double credits risk | payment/invoice handlers | Dedupe checkout vs invoice |
| 8 | Batch limit race condition | batch-limit.service.ts | Make atomic |
| 9 | In-memory batch limits | batch-limit.service.ts | Use persistent storage |
| 10 | Unbounded pagination | credits/history | Add max limit |
| 11 | Unbounded listUsers | admin/users | Add pagination |
| 12 | Test auth risk | auth.ts | Add multiple safeguards |

### P2 - Fix Within 2 Weeks (Medium)

| # | Issue | File | Action |
|---|-------|------|--------|
| 13-24 | Various medium issues | Multiple | See details above |

---

## Appendix: Files Audited

### Authentication & Authorization
- `server/middleware/requireAdmin.ts`
- `lib/middleware/auth.ts`
- `middleware.ts`
- `supabase/migrations/20250203_fix_admin_policy_recursion.sql`

### Payment & Billing
- `app/api/webhooks/stripe/handlers/*.ts`
- `app/api/webhooks/stripe/services/*.ts`
- `app/api/checkout/route.ts`
- `app/api/portal/route.ts`
- `app/api/subscription/**/*.ts`

### API Endpoints
- `app/api/admin/**/*.ts`
- `app/api/credits/**/*.ts`
- `app/api/upscale/route.ts`
- `app/api/proxy-image/route.ts`

### Credit System
- `supabase/migrations/*credit*.sql`
- `server/services/batch-limit.service.ts`
- `server/services/SubscriptionCredits.ts`
- `server/services/replicate.service.ts`

### Client-Side
- `client/utils/api-client.ts`
- `client/components/seo/JsonLd.tsx`
- `client/services/stripeService.ts`
- `app/(pseo)/_components/pseo/ui/MarkdownRenderer.tsx`

### File Upload & Processing
- `shared/validation/upscale.schema.ts`
- `client/utils/file-validation.ts`
- `client/components/tools/shared/MultiFileDropzone.tsx`

---

*Report generated by automated security audit agents. Manual review recommended for all critical findings before implementing fixes.*
