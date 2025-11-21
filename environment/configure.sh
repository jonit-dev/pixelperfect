#!/bin/bash

# ============================================================================
# Environment Configuration Script
# ============================================================================
# This is a lightweight script for quick environment setup.
# For full setup (including Supabase), use: yarn setup
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "PixelPerfect Environment Configuration"
echo "======================================"
echo ""

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "✓ Created .env"
    else
        echo "⚠ .env.example not found"
    fi
else
    echo "✓ .env already exists"
fi

# Copy .env.prod.example to .env.prod if it doesn't exist
if [ ! -f .env.prod ]; then
    if [ -f .env.prod.example ]; then
        echo "Creating .env.prod from .env.prod.example..."
        cp .env.prod.example .env.prod
        echo "✓ Created .env.prod"
    else
        echo "⚠ .env.prod.example not found"
    fi
else
    echo "✓ .env.prod already exists"
fi

echo ""
echo "Environment files ready!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Supabase public credentials"
echo "  2. Edit .env.prod with your secret keys"
echo "  3. Run 'yarn setup' for full interactive setup"
echo ""
echo "Or run 'yarn setup' now for guided configuration."
echo ""
