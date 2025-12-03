#!/bin/bash
# Deployment script for cron worker
# Usage: ./scripts/deploy.sh [environment]
#   environment: development | production (default: production)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$WORKER_DIR"

ENV="${1:-production}"

echo "🚀 Deploying pixelperfect-cron worker to $ENV environment..."
echo ""

# Check if CRON_SECRET is set
if [ "$ENV" = "production" ]; then
  echo "⚠️  Make sure you've set the CRON_SECRET:"
  echo "   wrangler secret put CRON_SECRET"
  echo ""
  read -p "Have you set the CRON_SECRET? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled. Set the secret first:"
    echo "   wrangler secret put CRON_SECRET"
    exit 1
  fi
fi

# Deploy
if [ "$ENV" = "production" ]; then
  wrangler deploy --env production
else
  wrangler deploy --env development
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. View logs: wrangler tail"
echo "  2. Test health: curl https://pixelperfect-cron.workers.dev/health"
echo "  3. Manual trigger: node scripts/test-trigger.js webhook-recovery https://pixelperfect-cron.workers.dev"
echo ""
