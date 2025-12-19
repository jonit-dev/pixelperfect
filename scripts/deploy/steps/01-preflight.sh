#!/bin/bash

step_preflight() {
    log_step 1 "Preflight checks"

    # Required env vars
    for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_ZONE_ID DOMAIN_NAME; do
        [[ -z "${!var:-}" ]] && log_error "Missing $var in .env.api"
    done
    log_success "Environment variables"

    # Wrangler auth
    if ! npx wrangler whoami &>/dev/null; then
        log_info "Running wrangler login..."
        npx wrangler login
    fi
    log_success "Wrangler authenticated"
}
