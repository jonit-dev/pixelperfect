#!/bin/bash

# ============================================================================
# Step 6: Generate TypeScript types from Supabase schema
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

PROJECT_ROOT="$(get_project_root)"

generate_types() {
    log_step "Generating TypeScript types..."

    # Load environment
    load_env "$PROJECT_ROOT"

    local project_ref="${SUPABASE_PROJECT_REF:-$(get_supabase_project_ref)}"

    if ! command_exists supabase; then
        log_warning "Supabase CLI not installed - skipping type generation"
        echo ""
        echo "Install with: brew install supabase/tap/supabase"
        echo ""
        echo "Or generate manually:"
        echo "  npx supabase gen types typescript --project-id $project_ref > src/types/supabase.ts"
        return 0
    fi

    # Ensure types directory exists
    mkdir -p "$PROJECT_ROOT/src/types"

    # Link if needed
    cd "$PROJECT_ROOT"
    if [[ ! -f "$PROJECT_ROOT/supabase/.temp/project-ref" ]]; then
        supabase link --project-ref "$project_ref" 2>/dev/null || true
    fi

    # Generate types
    local output_file="$PROJECT_ROOT/src/types/supabase.ts"

    if supabase gen types typescript --project-id "$project_ref" > "$output_file" 2>/dev/null; then
        log_success "Generated: src/types/supabase.ts"
    else
        log_warning "Could not generate types"
        echo ""
        echo "Generate manually:"
        echo "  supabase gen types typescript --project-id $project_ref > src/types/supabase.ts"
    fi

    return 0
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    generate_types
fi
