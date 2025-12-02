#!/bin/bash

# Centralized Stripe Configuration Script
# This script ensures all Stripe usage reads from .env file

set -euo pipefail

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Validate required Stripe variables
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
    echo "❌ STRIPE_SECRET_KEY not found in .env!"
    exit 1
fi

if [ -z "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]; then
    echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in .env!"
    exit 1
fi

echo "✅ Stripe configuration loaded from .env:"
echo "   Secret Key: ${STRIPE_SECRET_KEY:0:20}..."
echo "   Publishable Key: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:0:20}..."