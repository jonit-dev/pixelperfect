#!/bin/bash

step_preflight() {
    log_step 1 "Preflight checks"

    # Required Cloudflare env vars
    for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_ZONE_ID DOMAIN_NAME; do
        [[ -z "${!var:-}" ]] && log_error "Missing $var in .env.api"
    done
    log_success "Cloudflare credentials"

    # Required Stripe env vars
    for var in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
        [[ -z "${!var:-}" ]] && log_error "Missing $var in .env.api"
    done
    log_success "Stripe credentials"

    # Wrangler auth
    if ! npx wrangler whoami &>/dev/null; then
        log_info "Running wrangler login..."
        npx wrangler login
    fi
    log_success "Wrangler authenticated"

    # Stripe products check (informational only)
    check_stripe_products
}

check_stripe_products() {
    log_info "Checking Stripe products..."

    # Query Stripe for active products
    local products
    products=$(curl -s -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        "https://api.stripe.com/v1/products?active=true&limit=100" 2>/dev/null)

    if [[ -z "$products" ]] || echo "$products" | grep -q '"error"'; then
        log_warn "Could not verify Stripe products (API error)"
        return 0
    fi

    local missing=""

    # Check subscription products (by metadata tier OR by name)
    # Starter
    if ! echo "$products" | grep -qE '"tier":\s*"starter"' && \
       ! echo "$products" | grep -qi '"name":\s*"Starter'; then
        missing="$missing starter"
    fi
    # Hobby
    if ! echo "$products" | grep -qE '"tier":\s*"hobby"' && \
       ! echo "$products" | grep -qi '"name":\s*"Hobby'; then
        missing="$missing hobby"
    fi
    # Pro/Professional
    if ! echo "$products" | grep -qE '"tier":\s*"pro"' && \
       ! echo "$products" | grep -qi '"name":\s*"Pro' && \
       ! echo "$products" | grep -qi '"name":\s*"Professional'; then
        missing="$missing pro"
    fi
    # Business
    if ! echo "$products" | grep -qE '"tier":\s*"business"' && \
       ! echo "$products" | grep -qi '"name":\s*"Business'; then
        missing="$missing business"
    fi

    # Check credit pack products (by metadata pack_key OR by name)
    # Small / Starter Credits Pack
    if ! echo "$products" | grep -qE '"pack_key":\s*"small"' && \
       ! echo "$products" | grep -qi '"name":\s*"Small Credit' && \
       ! echo "$products" | grep -qi '"name":\s*"Starter Credits'; then
        missing="$missing small"
    fi
    # Medium / Pro Credits Pack
    if ! echo "$products" | grep -qE '"pack_key":\s*"medium"' && \
       ! echo "$products" | grep -qi '"name":\s*"Medium Credit' && \
       ! echo "$products" | grep -qi '"name":\s*"Pro Credits'; then
        missing="$missing medium"
    fi
    # Large / Enterprise Credits Pack
    if ! echo "$products" | grep -qE '"pack_key":\s*"large"' && \
       ! echo "$products" | grep -qi '"name":\s*"Large Credit' && \
       ! echo "$products" | grep -qi '"name":\s*"Enterprise Credits'; then
        missing="$missing large"
    fi

    if [[ -n "$missing" ]]; then
        log_warn "Stripe products may be missing:$missing"
        log_info "Run 'yarn stripe:setup' to fix or verify manually in Stripe Dashboard"
    else
        log_success "Stripe products configured"
    fi
}
