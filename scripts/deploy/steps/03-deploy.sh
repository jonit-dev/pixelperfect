#!/bin/bash

step_deploy() {
    log_step 3 "Deploying"

    cd "$PROJECT_ROOT"

    # Main worker
    log_info "Deploying main worker..."
    npx opennextjs-cloudflare deploy
    log_success "Main worker deployed"

    # Cron worker
    if [[ -d "workers/cron" ]]; then
        log_info "Deploying cron worker..."
        cd workers/cron
        npx wrangler deploy
        log_success "Cron worker deployed"
        cd "$PROJECT_ROOT"
    fi
}
