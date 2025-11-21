# PixelPerfect

AI-powered image processing SaaS application built with Next.js, Supabase, and Stripe.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes (Cloudflare Workers)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email, Google, GitHub OAuth)
- **Payments**: Stripe (Subscriptions & One-time Credits)
- **Deployment**: Cloudflare Pages
- **Monitoring**: Baselime

## Quick Start

```bash
# Install dependencies
yarn install

# Copy environment files
cp .env.example .env
cp .env.prod.example .env.prod

# Run database migrations
./scripts/setup-supabase.sh --manual

# Start development server
yarn dev
```

## Setup Guides

| Guide                                                         | Description                              |
| ------------------------------------------------------------- | ---------------------------------------- |
| [Supabase Setup](docs/guides/supabase-setup.md)               | Database, Auth, and RLS configuration    |
| [Google OAuth Setup](docs/guides/google-oauth-setup.md)       | Google Cloud Console OAuth configuration |
| [GitHub OAuth Setup](docs/guides/github-oauth-setup.md)       | GitHub OAuth App configuration           |
| [Stripe Setup](docs/guides/stripe-setup.md)                   | Payments, subscriptions, and webhooks    |
| [E2E Testing Setup](docs/guides/e2e-testing-setup.md)         | Playwright test configuration            |
| [Cloudflare Deployment](docs/guides/cloudflare-deployment.md) | Production deployment                    |
| [Baselime Setup](docs/guides/baselime-setup.md)               | Error monitoring                         |

## Environment Variables

This project uses a split environment variable structure:

| File        | Purpose          | Contains                                               |
| ----------- | ---------------- | ------------------------------------------------------ |
| `.env`      | Public variables | `NEXT_PUBLIC_*` prefixed variables                     |
| `.env.prod` | Server secrets   | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc. |

See [Supabase Setup Guide](docs/guides/supabase-setup.md) for details.

## Available Scripts

| Command         | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `yarn dev`      | Start development server (Next.js + Wrangler + Stripe CLI) |
| `yarn build`    | Build for production                                       |
| `yarn verify`   | Run TypeScript, ESLint, and all tests                      |
| `yarn test:e2e` | Run E2E browser tests                                      |
| `yarn test:api` | Run API tests                                              |
| `yarn test:all` | Run all Playwright tests                                   |

## Documentation

- **Setup Guides**: `docs/guides/`
- **PRDs**: `docs/PRDs/`
- **Technical Docs**: `docs/technical/`
- **Roadmap**: `docs/management/ROADMAP.md`

## Project Structure

```
├── app/                    # Next.js App Router pages
├── src/
│   ├── components/         # React components
│   ├── config/             # App configuration
│   ├── lib/                # Utility libraries
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
├── supabase/
│   └── migrations/         # Database migrations
├── tests/
│   ├── e2e/                # E2E browser tests
│   ├── api/                # API tests
│   ├── pages/              # Page Object Models
│   └── helpers/            # Test utilities
├── scripts/                # Setup and utility scripts
└── docs/                   # Documentation
```

## License

Private - All rights reserved.
