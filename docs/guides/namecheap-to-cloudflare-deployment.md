# Namecheap Domain to Cloudflare Deployment Guide

Complete guide for deploying a Next.js application from domain purchase on Namecheap to production deployment on Cloudflare Workers/Pages.

## Table of Contents

1. [Required Tokens/API Keys](#required-tokensapi-keys)
2. [Manual Steps](#manual-steps-one-time-setup)
3. [Automated Deployment](#automated-deployment)
4. [Troubleshooting](#troubleshooting)

---

## Required Tokens/API Keys

Before running the automated deployment script, you need these credentials:

| Token/Key | Where to Get It | Purpose |
|-----------|-----------------|---------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) | Deploy workers, manage DNS |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard > Workers & Pages > Account ID (right sidebar) | Identify your account |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Dashboard > Your Domain > Overview > Zone ID (right sidebar) | Configure domain settings |

### Creating the Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template, then add:
   - Zone > DNS > Edit
   - Zone > Zone Settings > Edit
   - Zone > SSL and Certificates > Edit
4. Under **Zone Resources**, select your domain
5. Click **Continue to Summary** > **Create Token**
6. Save the token securely

---

## Manual Steps (One-Time Setup)

These steps require human interaction and cannot be automated.

### 1. Purchase Domain on Namecheap

1. Go to [namecheap.com](https://www.namecheap.com)
2. Search and purchase your domain
3. Enable **WhoisGuard** privacy protection (free)
4. Enable **Auto-Renew** (optional)
5. Verify domain ownership via email

### 2. Disable DNSSEC on Namecheap

Before transferring to Cloudflare:

1. Go to **Domain List** in Namecheap dashboard
2. Click **Manage** next to your domain
3. Navigate to **Advanced DNS** tab
4. Find **DNSSEC** section and ensure it's **disabled**

### 3. Create Cloudflare Account & Add Domain

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up and verify email
3. Click **Add a Site**
4. Enter your domain name
5. Select **Free** plan
6. Note the two nameservers provided (e.g., `brad.ns.cloudflare.com`)

### 4. Update Nameservers in Namecheap

1. In Namecheap dashboard, go to **Domain List** > **Manage**
2. Change **Nameservers** from "Namecheap BasicDNS" to **Custom DNS**
3. Enter Cloudflare's nameservers
4. Save changes
5. Wait for propagation (5 minutes to 24 hours)

### 5. Verify Domain is Active

1. Return to Cloudflare dashboard
2. Click **Check nameservers now**
3. Wait until domain status shows **Active**

---

## Automated Deployment

Once manual setup is complete, use the deployment script for all subsequent operations.

### Quick Start

```bash
# Set required environment variables
export CLOUDFLARE_API_TOKEN="your_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_ZONE_ID="your_zone_id"
export DOMAIN_NAME="yourdomain.com"

# Run deployment
./scripts/deploy-cloudflare.sh
```

### What the Script Does

1. **Validates prerequisites** - Checks Node.js, yarn, and required tokens
2. **Installs dependencies** - Adds OpenNext and Wrangler
3. **Creates config files** - Generates `wrangler.jsonc`, `open-next.config.ts`, etc.
4. **Builds and deploys** - Runs OpenNext build and deploys to Cloudflare
5. **Configures custom domain** - Adds your domain to the worker
6. **Sets SSL/TLS settings** - Enables Full (strict) mode and security features
7. **Configures environment variables** - Sets up production env vars (if provided)

### Script Options

```bash
# Full deployment (default)
./scripts/deploy-cloudflare.sh

# Skip dependency installation
./scripts/deploy-cloudflare.sh --skip-deps

# Only configure domain settings (no deploy)
./scripts/deploy-cloudflare.sh --domain-only

# Only set environment variables
./scripts/deploy-cloudflare.sh --env-only
```

### Environment Variables

Create a `.env.production` file with your production values, and the script will upload them:

```bash
# .env.production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
# ... other variables
```

---

## CI/CD Integration (Optional)

### GitHub Actions Setup

1. Add secrets to your repository:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. The script works in CI environments automatically.

### Manual Git Integration via Dashboard

1. Go to **Workers & Pages** in Cloudflare
2. Click **Create** > **Pages** > **Connect to Git**
3. Select your repository
4. Configure:
   - **Production branch**: `main` or `master`
   - **Build command**: `yarn deploy`
   - **Build output**: `.open-next/assets`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Nameservers not updating** | Wait 24-48 hours. Flush DNS: `sudo dscacheutil -flushcache` (macOS) |
| **SSL certificate pending** | Ensure nameservers point to Cloudflare. Wait up to 24 hours. |
| **Build fails** | Check Wrangler version is 3.99.0+. Ensure `nodejs_compat` flag is set. |
| **Worker size exceeded** | Free plan: 3MB limit. Consider code splitting or upgrading. |
| **Environment vars not found** | Redeploy after adding variables. Check names match exactly. |
| **API routes returning 404** | Remove `export const runtime = "edge"` from routes. |
| **Database connection errors** | Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly. |

### Verify Deployment

```bash
curl https://yourdomain.com/api/health
curl https://yourdomain.com/sitemap.xml
```

### View Logs

```bash
npx wrangler tail
```

---

## Post-Deployment Checklist

- [ ] Domain resolves correctly
- [ ] SSL certificate is valid
- [ ] All pages load without errors
- [ ] API routes respond correctly
- [ ] Database connections work
- [ ] Payment processing works
- [ ] Analytics tracking works

---

## References

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Workers Next.js Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
