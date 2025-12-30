# MyImageUpscaler - Claude Instructions

## Before Starting

Check `.claude/skills/` for relevant patterns.

## Critical Constraints

- **Cloudflare Workers**: 10ms CPU limit. No heavy computation. Prefer streaming. Delegate to browser when safe.
- **Colors**: Never hardcode - use Tailwind config tokens only.
- **Docs**: No auto-generated .md files unless explicitly requested.

## Before Finishing

- Write tests for your changes
- Run `yarn test` on affected areas
- Run `yarn verify` (required before completing any task)

## Conventions

- Principles: SOLID, SRP, KISS, DRY, YAGNI
- Interfaces: Prefix with `I` (e.g., `IUser`)
- Dates: dayjs
- Logging: `server/monitoring/logger.ts` | `client/utils/logger.ts`

## Key Paths

- PRDs: `docs/PRDs/` → move to `done/` when complete
- Roadmap: `docs/management/ROADMAP.md`
- Env: `.env.client` (public) | `.env.api` (secrets)

## Stack

Next.js 15 (App Router), Supabase, Stripe, Cloudflare Pages, Baselime, Zod, Zustand
