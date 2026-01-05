#!/bin/bash

step_build() {
    log_step 2 "Building"

    cd "$PROJECT_ROOT"

    log_info "Building blog data..."
    npx tsx scripts/build-blog.ts

    log_info "OpenNext build..."
    npx opennextjs-cloudflare build

    [[ ! -f ".open-next/worker.js" ]] && log_error "Build failed"
    log_success "Build complete"
}
