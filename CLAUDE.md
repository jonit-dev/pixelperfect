# Claude Code Instructions

Project-specific instructions for Claude Code AI assistant.

## Environment Variables

This project uses a split environment variable structure:

### `.env` - Public variables only
- Contains only `NEXT_PUBLIC_*` prefixed variables
- Safe to commit (though `.env` itself is gitignored)
- Exposed to browser/client-side code
- Example: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_BASELIME_KEY`

### `.env.prod` - Server-side secrets only
- Contains sensitive keys with NO prefix
- NEVER commit this file
- Only accessible on server-side
- Example: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `BASELIME_API_KEY`

### When adding new environment variables:
1. **Public/client-side vars** (`NEXT_PUBLIC_*`) → Add to `.env` and `.env.example`
2. **Server-side secrets** (no prefix) → Add to `.env.prod` and `.env.prod.example`

## Documentation

- Setup guides are in `docs/guides/`
- PRDs are in `docs/PRDs/`
- Technical docs are in `docs/technical/`
- Roadmap is at `docs/management/ROADMAP.md`

## Tech Stack

- Next.js 15 (App Router)
- Supabase (Auth + Database)
- Stripe (Payments)
- Cloudflare Pages (Deployment)
- Baselime (Error Monitoring)
