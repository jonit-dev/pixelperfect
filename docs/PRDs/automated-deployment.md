# PRD: Automated Deployment System

## Command

```bash
yarn deploy
```

One command. Handles everything. Each step is idempotent.

---

## What It Does

```
┌─────────────────────────────────────────────────────────┐
│  yarn deploy                                            │
├─────────────────────────────────────────────────────────┤
│  1. Preflight    → Check deps, env, wrangler auth       │
│  2. Build        → OpenNext build                       │
│  3. Deploy       → Worker + Cron                        │
│  4. Configure    → Domain routes + SSL (idempotent)     │
│  5. Secrets      → Upload to Cloudflare                 │
│  6. Verify       → Health check                         │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
scripts/deploy/
├── deploy.sh           # Orchestrator (entry point)
├── common.sh           # Shared utilities
└── steps/
    ├── 01-preflight.sh # Check deps, env, auth
    ├── 02-build.sh     # OpenNext build
    ├── 03-deploy.sh    # Deploy worker + cron
    ├── 04-configure.sh # Domain + SSL (idempotent)
    ├── 05-secrets.sh   # Upload secrets
    └── 06-verify.sh    # Health check
```

---

## Implementation

### `scripts/deploy/deploy.sh`

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

source "$SCRIPT_DIR/common.sh"
source "$PROJECT_ROOT/scripts/load-env.sh"

echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  myimageupscaler.com Deploy${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""

START_TIME=$(date +%s)

source "$SCRIPT_DIR/steps/01-preflight.sh" && step_preflight
source "$SCRIPT_DIR/steps/02-build.sh" && step_build
source "$SCRIPT_DIR/steps/03-deploy.sh" && step_deploy
source "$SCRIPT_DIR/steps/04-configure.sh" && step_configure
source "$SCRIPT_DIR/steps/05-secrets.sh" && step_secrets
source "$SCRIPT_DIR/steps/06-verify.sh" && step_verify

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Done in ${DURATION}s${NC}"
echo -e "${GREEN}  https://${DOMAIN_NAME}${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
```

### `scripts/deploy/common.sh`

```bash
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_step()    { echo -e "\n${CYAN}[$1/6]${NC} $2"; }
log_info()    { echo -e "  ${CYAN}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn()    { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_error()   { echo -e "  ${RED}✗${NC} $1"; exit 1; }

cf_api() {
    curl -s -X "$1" "https://api.cloudflare.com/client/v4$2" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        ${3:+-d "$3"}
}
```

### `scripts/deploy/steps/01-preflight.sh`

```bash
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
```

### `scripts/deploy/steps/02-build.sh`

```bash
#!/bin/bash

step_build() {
    log_step 2 "Building"

    cd "$PROJECT_ROOT"

    log_info "OpenNext build..."
    npx opennextjs-cloudflare build

    [[ ! -f ".open-next/worker.js" ]] && log_error "Build failed"
    log_success "Build complete"
}
```

### `scripts/deploy/steps/03-deploy.sh`

```bash
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
```

### `scripts/deploy/steps/04-configure.sh`

```bash
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
```

### `scripts/deploy/steps/05-secrets.sh`

```bash
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
```

### `scripts/deploy/steps/06-verify.sh`

```bash
#!/bin/bash

step_verify() {
    log_step 6 "Verifying"

    local url="https://$DOMAIN_NAME"

    log_info "Waiting for propagation..."
    sleep 5

    for i in {1..5}; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/health" 2>/dev/null || echo "000")
        if [[ "$status" == "200" ]]; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Attempt $i/5: HTTP $status"
        sleep 3
    done

    log_warn "Health check didn't return 200 (may still be propagating)"
}
```

---

## package.json

```json
{
  "scripts": {
    "deploy": "./scripts/deploy/deploy.sh"
  }
}
```

---

## Idempotent Design

| Step          | Already Done?         | Behavior                              |
| ------------- | --------------------- | ------------------------------------- |
| Wrangler auth | Already logged in     | Skip login                            |
| Build         | Previous build exists | Overwrite                             |
| Deploy worker | Already deployed      | Update                                |
| Domain routes | Already exist         | Cloudflare returns "exists", continue |
| SSL settings  | Already configured    | No-op (same value)                    |
| Secrets       | Already set           | Overwrite                             |
| Health check  | -                     | Always runs                           |

**First deploy = 100th deploy = same command.**

---

## Acceptance Criteria

- [ ] `yarn deploy` works without any flags
- [ ] Works on first deploy (creates everything)
- [ ] Works on subsequent deploys (updates only)
- [ ] Fails fast with clear error messages
- [ ] Total steps: 6
- [ ] No manual intervention needed
