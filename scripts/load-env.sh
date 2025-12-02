#!/bin/bash

# Generic Environment Loader Script
# Loads environment variables from .env file and validates them

set -euo pipefail

# Default to .env file, but allow override
ENV_FILE="${1:-.env}"

# Load environment variables from .env file
if [ -f "$ENV_FILE" ]; then
    echo "✅ Loading environment variables from $ENV_FILE"

    # Export all non-comment lines
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ $line =~ ^[[:space:]]*# ]] && continue
        [[ $line =~ ^[[:space:]]*$ ]] && continue

        # Export valid KEY=VALUE pairs
        if [[ $line =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            export "$line"
        fi
    done < "$ENV_FILE"

    echo "✅ Environment variables loaded successfully"
else
    echo "❌ Environment file '$ENV_FILE' not found!"
    exit 1
fi

# Function to validate required variables
validate_required_vars() {
    local missing_vars=()

    for var in "$@"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "❌ Missing required environment variables:"
        printf '   %s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Function to print loaded vars (with masking for sensitive ones)
print_loaded_vars() {
    local sensitive_patterns=("SECRET" "KEY" "TOKEN" "PASSWORD")

    echo "📋 Loaded environment variables:"
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ $line =~ ^[[:space:]]*# ]] && continue
        [[ $line =~ ^[[:space:]]*$ ]] && continue

        # Extract key and value
        if [[ $line =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"

            # Check if this is a sensitive variable
            is_sensitive=false
            for pattern in "${sensitive_patterns[@]}"; do
                if [[ $key == *"$pattern"* ]]; then
                    is_sensitive=true
                    break
                fi
            done

            if [ "$is_sensitive" = true ]; then
                # Show first 10 chars + masked
                masked_value="${value:0:10}...***"
                echo "   $key=$masked_value"
            else
                echo "   $key=$value"
            fi
        fi
    done < "$ENV_FILE"
}

# If script is called with --validate flag, validate common required vars
if [ "${1:-}" = "--validate" ]; then
    shift
    validate_required_vars "$@"
fi

# If script is called with --print flag, print loaded vars
if [ "${1:-}" = "--print" ]; then
    print_loaded_vars
fi