#!/bin/bash

step_secrets() {
    log_step 5 "Uploading secrets"

    local worker="${WORKER_NAME:-myimageupscaler.com}"

    # Secrets from .env.api
    local secrets=(
        SUPABASE_SERVICE_ROLE_KEY
        STRIPE_SECRET_KEY
        STRIPE_WEBHOOK_SECRET
        GEMINI_API_KEY
        REPLICATE_API_TOKEN
        CRON_SECRET
    )

    for secret in "${secrets[@]}"; do
        if [[ -n "${!secret:-}" ]]; then
            echo "${!secret}" | npx wrangler secret put "$secret" --name "$worker" 2>/dev/null
            log_success "$secret"
        fi
    done

    # Public vars needed server-side
    for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_BASE_URL; do
        if [[ -n "${!var:-}" ]]; then
            echo "${!var}" | npx wrangler secret put "$var" --name "$worker" 2>/dev/null
            log_success "$var"
        fi
    done
}
