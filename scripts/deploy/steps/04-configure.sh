#!/bin/bash

step_configure() {
    log_step 4 "Configuring domain & SSL"

    local domain="$DOMAIN_NAME"
    local worker="${WORKER_NAME:-myimageupscaler.com}"

    # Domain routes (idempotent - "already exists" is fine)
    for pattern in "$domain/*" "www.$domain/*"; do
        result=$(cf_api POST "/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
            "{\"pattern\": \"$pattern\", \"script\": \"$worker\"}")
        if echo "$result" | grep -q '"success":true\|already exists'; then
            log_success "Route: $pattern"
        else
            log_warn "Route $pattern: $(echo "$result" | jq -r '.errors[0].message // "unknown"')"
        fi
    done

    # SSL settings (idempotent)
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" '{"value":"strict"}' >/dev/null
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/always_use_https" '{"value":"on"}' >/dev/null
    cf_api PATCH "/zones/$CLOUDFLARE_ZONE_ID/settings/min_tls_version" '{"value":"1.2"}' >/dev/null
    log_success "SSL configured"
}
