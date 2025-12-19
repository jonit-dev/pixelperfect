#!/bin/bash

# ============================================================================
# Cloudflare Deployment Script
# Automates deployment to Cloudflare Workers with OpenNext
# ============================================================================

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$SCRIPT_DIR/setup/common.sh" 2>/dev/null || {
    # Inline logging if common.sh not available
    log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
    log_success() { echo -e "\033[0;32m[OK]\033[0m $1"; }
    log_warning() { echo -e "\033[1;33m[WARN]\033[0m $1"; }
    log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }
    log_step() { echo -e "\n\033[0;36m\033[1m▸ $1\033[0m"; }
}

# Default values
WORKER_NAME="${WORKER_NAME:-pixelperfect}"
SKIP_DEPS=false
DOMAIN_ONLY=false
ENV_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --domain-only)
            DOMAIN_ONLY=true
            shift
            ;;
        --env-only)
            ENV_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-deps     Skip dependency installation"
            echo "  --domain-only   Only configure domain settings (no deploy)"
            echo "  --env-only      Only set environment variables"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Required environment variables:"
            echo "  CLOUDFLARE_API_TOKEN   API token with Workers and Zone permissions"
            echo "  CLOUDFLARE_ACCOUNT_ID  Your Cloudflare account ID"
            echo "  CLOUDFLARE_ZONE_ID     Zone ID for your domain (for domain config)"
            echo "  DOMAIN_NAME            Your domain (e.g., pixelperfect.app)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# Validation
# ============================================================================

log_step "Validating prerequisites"

# Check required environment variables
check_required_vars() {
    local missing=()

    [[ -z "$CLOUDFLARE_API_TOKEN" ]] && missing+=("CLOUDFLARE_API_TOKEN")
    [[ -z "$CLOUDFLARE_ACCOUNT_ID" ]] && missing+=("CLOUDFLARE_ACCOUNT_ID")

    if [[ "$DOMAIN_ONLY" == "true" || -n "$DOMAIN_NAME" ]]; then
        [[ -z "$CLOUDFLARE_ZONE_ID" ]] && missing+=("CLOUDFLARE_ZONE_ID")
        [[ -z "$DOMAIN_NAME" ]] && missing+=("DOMAIN_NAME")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Set them with:"
        echo "  export CLOUDFLARE_API_TOKEN='your_token'"
        echo "  export CLOUDFLARE_ACCOUNT_ID='your_account_id'"
        echo "  export CLOUDFLARE_ZONE_ID='your_zone_id'"
        echo "  export DOMAIN_NAME='yourdomain.com'"
        exit 1
    fi

    log_success "Environment variables validated"
}

check_required_vars

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    log_error "Node.js 18+ required (found v$NODE_VERSION)"
    exit 1
fi
log_success "Node.js $(node -v) detected"

# Check yarn
if ! command -v yarn &> /dev/null; then
    log_error "Yarn is not installed"
    exit 1
fi
log_success "Yarn $(yarn -v) detected"

# ============================================================================
# Install Dependencies
# ============================================================================

if [[ "$SKIP_DEPS" == "false" && "$DOMAIN_ONLY" == "false" && "$ENV_ONLY" == "false" ]]; then
    log_step "Installing Cloudflare dependencies"

    cd "$PROJECT_ROOT"

    # Check if packages are already installed
    if ! yarn list @opennextjs/cloudflare &>/dev/null; then
        yarn add @opennextjs/cloudflare@latest
        log_success "Installed @opennextjs/cloudflare"
    else
        log_info "@opennextjs/cloudflare already installed"
    fi

    if ! yarn list wrangler &>/dev/null; then
        yarn add -D wrangler@latest
        log_success "Installed wrangler"
    else
        log_info "wrangler already installed"
    fi
fi

# ============================================================================
# Create Configuration Files
# ============================================================================

create_config_files() {
    log_step "Creating configuration files"

    cd "$PROJECT_ROOT"

    # wrangler.jsonc
    if [[ ! -f "wrangler.jsonc" ]]; then
        cat > wrangler.jsonc << 'EOF'
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "pixelperfect",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "pixelperfect"
    }
  ]
}
EOF
        log_success "Created wrangler.jsonc"
    else
        log_info "wrangler.jsonc already exists"
    fi

    # open-next.config.ts
    if [[ ! -f "open-next.config.ts" ]]; then
        cat > open-next.config.ts << 'EOF'
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Optional: Add R2 incremental cache for ISR
  // incrementalCache: r2IncrementalCache,
});
EOF
        log_success "Created open-next.config.ts"
    else
        log_info "open-next.config.ts already exists"
    fi

    # .dev.vars for local development
    if [[ ! -f ".dev.vars" ]]; then
        echo "NEXTJS_ENV=development" > .dev.vars
        log_success "Created .dev.vars"
    else
        log_info ".dev.vars already exists"
    fi

    # public/_headers for caching
    mkdir -p public
    if [[ ! -f "public/_headers" ]]; then
        cat > public/_headers << 'EOF'
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
EOF
        log_success "Created public/_headers"
    else
        log_info "public/_headers already exists"
    fi

    # Update .gitignore
    if ! grep -q ".open-next" .gitignore 2>/dev/null; then
        echo -e "\n# OpenNext\n.open-next\n.dev.vars" >> .gitignore
        log_success "Updated .gitignore"
    fi
}

if [[ "$DOMAIN_ONLY" == "false" && "$ENV_ONLY" == "false" ]]; then
    create_config_files
fi

# ============================================================================
# Set Environment Variables
# ============================================================================

set_env_vars() {
    log_step "Setting environment variables"

    local env_file="$PROJECT_ROOT/.env.production"

    if [[ ! -f "$env_file" ]]; then
        log_warning "No .env.production file found. Skipping environment variable upload."
        log_info "Create .env.production with your production values to upload them."
        return
    fi

    log_info "Uploading environment variables from .env.production"

    # Read each line and set as secret
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

        # Remove quotes from value
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"

        # Upload to Cloudflare
        echo "$value" | npx wrangler secret put "$key" --name "$WORKER_NAME" 2>/dev/null && \
            log_success "Set $key" || \
            log_warning "Failed to set $key"
    done < "$env_file"

    log_success "Environment variables configured"
}

if [[ "$ENV_ONLY" == "true" ]]; then
    set_env_vars
    log_success "Environment variables updated!"
    exit 0
fi

# ============================================================================
# Build and Deploy
# ============================================================================

deploy_worker() {
    log_step "Building and deploying to Cloudflare"

    cd "$PROJECT_ROOT"

    # Build with OpenNext
    log_info "Building with OpenNext..."
    npx opennextjs-cloudflare build

    # Deploy
    log_info "Deploying to Cloudflare Workers..."
    npx opennextjs-cloudflare deploy

    log_success "Deployed to Cloudflare Workers"
}

if [[ "$DOMAIN_ONLY" == "false" ]]; then
    deploy_worker
fi

# ============================================================================
# Configure Custom Domain
# ============================================================================

configure_domain() {
    if [[ -z "$DOMAIN_NAME" || -z "$CLOUDFLARE_ZONE_ID" ]]; then
        log_warning "Skipping domain configuration (DOMAIN_NAME or CLOUDFLARE_ZONE_ID not set)"
        return
    fi

    log_step "Configuring custom domain: $DOMAIN_NAME"

    local API_BASE="https://api.cloudflare.com/client/v4"
    local AUTH_HEADER="Authorization: Bearer $CLOUDFLARE_API_TOKEN"

    # Get worker subdomain
    local WORKER_SUBDOMAIN=$(curl -s -X GET \
        "$API_BASE/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" | jq -r '.result.subdomain // empty')

    if [[ -z "$WORKER_SUBDOMAIN" ]]; then
        log_warning "Could not get worker subdomain. Domain setup may require manual configuration."
    fi

    # Add custom domain route
    log_info "Adding custom domain route..."

    local ROUTE_RESULT=$(curl -s -X POST \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"pattern\": \"$DOMAIN_NAME/*\", \"script\": \"$WORKER_NAME\"}")

    if echo "$ROUTE_RESULT" | jq -e '.success' &>/dev/null; then
        log_success "Added route for $DOMAIN_NAME/*"
    else
        local ERROR=$(echo "$ROUTE_RESULT" | jq -r '.errors[0].message // "Unknown error"')
        if [[ "$ERROR" == *"already exists"* ]]; then
            log_info "Route already exists for $DOMAIN_NAME"
        else
            log_warning "Route creation: $ERROR"
        fi
    fi

    # Add www subdomain route
    log_info "Adding www subdomain route..."

    local WWW_RESULT=$(curl -s -X POST \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"pattern\": \"www.$DOMAIN_NAME/*\", \"script\": \"$WORKER_NAME\"}")

    if echo "$WWW_RESULT" | jq -e '.success' &>/dev/null; then
        log_success "Added route for www.$DOMAIN_NAME/*"
    else
        local WWW_ERROR=$(echo "$WWW_RESULT" | jq -r '.errors[0].message // "Unknown error"')
        if [[ "$WWW_ERROR" == *"already exists"* ]]; then
            log_info "Route already exists for www.$DOMAIN_NAME"
        else
            log_warning "WWW route creation: $WWW_ERROR"
        fi
    fi
}

configure_domain

# ============================================================================
# Configure SSL/TLS Settings
# ============================================================================

configure_ssl() {
    if [[ -z "$CLOUDFLARE_ZONE_ID" ]]; then
        log_warning "Skipping SSL configuration (CLOUDFLARE_ZONE_ID not set)"
        return
    fi

    log_step "Configuring SSL/TLS settings"

    local API_BASE="https://api.cloudflare.com/client/v4"
    local AUTH_HEADER="Authorization: Bearer $CLOUDFLARE_API_TOKEN"

    # Set SSL mode to Full (strict)
    log_info "Setting SSL mode to Full (strict)..."
    curl -s -X PATCH \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"value": "strict"}' > /dev/null
    log_success "SSL mode set to Full (strict)"

    # Enable Always Use HTTPS
    log_info "Enabling Always Use HTTPS..."
    curl -s -X PATCH \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/settings/always_use_https" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"value": "on"}' > /dev/null
    log_success "Always Use HTTPS enabled"

    # Enable Automatic HTTPS Rewrites
    log_info "Enabling Automatic HTTPS Rewrites..."
    curl -s -X PATCH \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/settings/automatic_https_rewrites" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"value": "on"}' > /dev/null
    log_success "Automatic HTTPS Rewrites enabled"

    # Set minimum TLS version to 1.2
    log_info "Setting minimum TLS version to 1.2..."
    curl -s -X PATCH \
        "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/settings/min_tls_version" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"value": "1.2"}' > /dev/null
    log_success "Minimum TLS version set to 1.2"
}

configure_ssl

# ============================================================================
# Upload Environment Variables
# ============================================================================

if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    set_env_vars
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
log_step "Deployment Complete!"
echo ""
echo "Your application is now deployed to Cloudflare Workers."
echo ""

if [[ -n "$DOMAIN_NAME" ]]; then
    echo "URLs:"
    echo "  - https://$DOMAIN_NAME"
    echo "  - https://www.$DOMAIN_NAME"
    echo "  - https://$WORKER_NAME.$CLOUDFLARE_ACCOUNT_ID.workers.dev (fallback)"
else
    echo "Worker URL:"
    echo "  - https://$WORKER_NAME.$CLOUDFLARE_ACCOUNT_ID.workers.dev"
fi

echo ""
echo "Next steps:"
echo "  1. Verify deployment: curl https://$DOMAIN_NAME/api/health"
echo "  2. Check logs: npx wrangler tail"
echo "  3. View dashboard: https://dash.cloudflare.com"
echo ""
