#!/bin/bash

# Configuration
GCLOUD_SECRET_API="myimageupscaler-api-prod"
GCLOUD_SECRET_CLIENT="myimageupscaler-client-prod"
ENV_API_PROD="$PROJECT_ROOT/.env.api.prod"
ENV_CLIENT_PROD="$PROJECT_ROOT/.env.client.prod"

step_fetch_secrets() {
    log_step 0 "Fetching production secrets"

    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not installed. Install from: https://cloud.google.com/sdk/docs/install"
    fi
    log_success "gcloud CLI found"

    # Check authentication
    if ! gcloud auth print-identity-token &> /dev/null; then
        log_error "Not authenticated. Run: gcloud auth login"
    fi
    log_success "gcloud authenticated"

    # Fetch API secrets
    log_info "Fetching $GCLOUD_SECRET_API..."
    if ! gcloud secrets versions access latest --secret="$GCLOUD_SECRET_API" > "$ENV_API_PROD" 2>/dev/null; then
        log_error "Failed to fetch secret '$GCLOUD_SECRET_API'. Ensure it exists in GCloud Secret Manager."
    fi
    log_success ".env.api.prod written"

    # Fetch client secrets
    log_info "Fetching $GCLOUD_SECRET_CLIENT..."
    if ! gcloud secrets versions access latest --secret="$GCLOUD_SECRET_CLIENT" > "$ENV_CLIENT_PROD" 2>/dev/null; then
        rm -f "$ENV_API_PROD"  # Cleanup partial state
        log_error "Failed to fetch secret '$GCLOUD_SECRET_CLIENT'. Ensure it exists in GCloud Secret Manager."
    fi
    log_success ".env.client.prod written"
}
