#!/bin/bash

# ============================================================================
# Step 4: Configure Supabase Auth settings
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

PROJECT_ROOT="$(get_project_root)"

configure_supabase_auth() {
    log_step "Configuring Supabase Auth..."

    # Load environment
    load_env "$PROJECT_ROOT"

    local project_ref="${SUPABASE_PROJECT_REF:-$(get_supabase_project_ref)}"

    echo ""
    echo "The following settings should be configured in Supabase Dashboard:"
    echo ""
    echo -e "  ${BOLD}Authentication → URL Configuration${NC}"
    echo "  https://supabase.com/dashboard/project/$project_ref/auth/url-configuration"
    echo ""
    echo "  Recommended settings:"
    echo ""
    echo "    Site URL:       http://localhost:3000"
    echo "    Redirect URLs:  http://localhost:3000/**"
    echo ""
    echo -e "  ${BOLD}Authentication → Providers${NC}"
    echo "  https://supabase.com/dashboard/project/$project_ref/auth/providers"
    echo ""
    echo "    Email:   Enabled (default)"
    echo "    Google:  Optional - see docs/guides/google-oauth-setup.md"
    echo "    GitHub:  Optional - see docs/guides/github-oauth-setup.md"
    echo ""

    read -p "  Open URL Configuration in browser? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open_url "https://supabase.com/dashboard/project/$project_ref/auth/url-configuration"
    fi

    echo ""
    read -p "  Press Enter when done configuring (or Ctrl+C to skip)..."

    log_success "Auth configuration noted"
    return 0
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    configure_supabase_auth
fi
