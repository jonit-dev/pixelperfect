# Scripts Directory

## Overview
Automation scripts for setup, deployment, testing, and development workflow.

## Structure

### Setup Scripts (`scripts/`)
- `setup.sh` - Main project setup script
- `setup/` - Individual setup step scripts
  - `01-dependencies.sh` - Install system dependencies
  - `02-environment.sh` - Environment setup
  - `03-git-hooks.sh` - Git hooks configuration
  - `04-services.sh` - External services setup
  - `05-migrations.sh` - Database migrations
  - `06-types.sh` - TypeScript type generation

### Development Scripts
- `dev-test.sh` - Development environment testing
- Deployment helpers
- Build automation scripts

## Usage
```bash
# Complete project setup
yarn bootstrap

# Individual setup steps
yarn setup:env    # Environment setup only
yarn setup:db     # Database migrations only
yarn setup:types  # Type generation only
```

## Script Standards
- All scripts must be executable (`chmod +x`)
- Use proper error handling with `set -e`
- Include descriptive comments
- Handle both macOS and Linux environments
- Use environment variables for configuration
- Provide clear success/error messages

## Environment Variables
Scripts use environment variables from:
- `.env` - Public variables (NEXT_PUBLIC_*)
- `.env.prod` - Server secrets (no prefix)

## Common Script Patterns
- Check for required dependencies
- Validate environment before proceeding
- Provide rollback functionality where possible
- Log actions for debugging
- Handle permission issues gracefully