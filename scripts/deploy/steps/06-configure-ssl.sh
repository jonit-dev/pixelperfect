#!/bin/bash
# Step 6: Configure SSL/TLS

step_configure_ssl() {
    log_step "6/8" "Configuring SSL/TLS"

    # SSL mode: Full (strict)
    log_info "Setting SSL mode to Full (strict)..."
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        '{"value": "strict"}' >/dev/null
    log_success "SSL mode: Full (strict)"

    # Always HTTPS
    log_info "Enabling Always Use HTTPS..."
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/always_use_https" \
        '{"value": "on"}' >/dev/null
    log_success "Always Use HTTPS: enabled"

    # Auto HTTPS rewrites
    log_info "Enabling Automatic HTTPS Rewrites..."
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/automatic_https_rewrites" \
        '{"value": "on"}' >/dev/null
    log_success "HTTPS Rewrites: enabled"

    # Min TLS 1.2
    log_info "Setting minimum TLS version..."
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/min_tls_version" \
        '{"value": "1.2"}' >/dev/null
    log_success "Min TLS: 1.2"
}