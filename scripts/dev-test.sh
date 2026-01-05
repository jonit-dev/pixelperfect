#!/bin/bash

# Start dev server with test environment variables
# This script is used by Playwright to ensure tests run with correct env vars
#
# Uses random ports to avoid conflicts when running multiple test instances:
# - Next.js: random port between 3100-3999
# - Wrangler: random port between 8800-8999
#
# Each test instance gets its own .next directory to prevent lock file conflicts

set -e

# Load test environment variables (filter out comments and empty lines)
export $(grep -v '^#' .env.test | grep -v '^$' | xargs)

# Generate random ports if not provided (allows Playwright to pass them in)
TEST_PORT=${TEST_PORT:-$((3100 + RANDOM % 900))}
TEST_WRANGLER_PORT=${TEST_WRANGLER_PORT:-$((8800 + RANDOM % 200))}

# Generate unique instance ID for this test run to isolate .next directory
# This prevents lock file conflicts when running parallel tests
export TEST_INSTANCE_ID=${TEST_INSTANCE_ID:-$$-$(date +%s%N | cut -b1-13)}

echo "Starting test server: port=$TEST_PORT, instance=$TEST_INSTANCE_ID"

# Cleanup function to remove test-specific .next directory on exit
cleanup() {
  local dist_dir=".next-test-${TEST_INSTANCE_ID}"
  if [ -d "$dist_dir" ]; then
    echo "Cleaning up test build directory: $dist_dir"
    rm -rf "$dist_dir"
  fi
}

# Register cleanup on script exit (including signals)
trap cleanup EXIT INT TERM

# Clean up old test directories (older than 1 hour) to prevent disk bloat
find . -maxdepth 1 -name ".next-test-*" -type d -mmin +60 -exec rm -rf {} \; 2>/dev/null || true

# Remove stale lock file from main .next directory if it exists and is older than 5 minutes
if [ -f ".next/dev/lock" ]; then
  if [ "$(find .next/dev/lock -mmin +5 2>/dev/null)" ]; then
    echo "Removing stale lock file from .next/dev/"
    rm -f .next/dev/lock
  fi
fi

# Run the dev server on test-specific ports (wrangler disabled for faster test startup)
# The TEST_INSTANCE_ID env var tells next.config.js to use a unique distDir
npx next dev --port $TEST_PORT
