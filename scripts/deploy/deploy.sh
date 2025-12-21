#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Parse flags
export SKIP_SECRETS="false"
export SKIP_TESTS="false"
for arg in "$@"; do
    case $arg in
        --skip-secrets) SKIP_SECRETS="true" ;;
        --skip-tests) SKIP_TESTS="true" ;;
    esac
done

source "$SCRIPT_DIR/common.sh"
source "$PROJECT_ROOT/scripts/load-env.sh"

echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  MyImageUpscaler Deploy${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""

START_TIME=$(date +%s)

# Run tests unless skipped
if [ "$SKIP_TESTS" = "false" ]; then
    echo -e "${CYAN}▸ Running tests...${NC}"
    cd "$PROJECT_ROOT"
    if ! yarn test; then
        echo -e "${RED}✗ Tests failed. Deployment blocked.${NC}"
        echo -e "${YELLOW}  Use --skip-tests to bypass test checking${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ All tests passed${NC}"
    echo ""
else
    echo -e "${YELLOW}▸ Skipping tests (--skip-tests flag)${NC}"
    echo ""
fi

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
