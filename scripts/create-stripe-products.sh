#!/bin/bash

# Direct Stripe API Product Creation Script
# Uses curl to create products via Stripe REST API

set -euo pipefail

# Source environment variables
source "$(dirname "$0")/load-env.sh"

# Validate required variables
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
    echo "❌ STRIPE_SECRET_KEY not found!"
    exit 1
fi

echo "🚀 Creating Stripe products via REST API..."

# API base URL
STRIPE_API="https://api.stripe.com/v1"

# Function to make Stripe API call
stripe_api() {
    local method="${1:-GET}"
    local endpoint="$2"
    local data="${3:-}"

    local curl_cmd=(
        curl -s -X "$method"
        -u "$STRIPE_SECRET_KEY:"
        -H "Content-Type: application/x-www-form-urlencoded"
        "https://api.stripe.com/v1$endpoint"
    )

    if [ -n "$data" ]; then
        curl_cmd+=(-d "$data")
    fi

    "${curl_cmd[@]}"
}

# Function to create product
create_product() {
    local name="$1"
    local description="$2"

    local response=$(stripe_api "POST" "/products" "name=$name&description=$description")
    local product_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')

    if [ -z "$product_id" ]; then
        echo "❌ Failed to create product: $name"
        echo "Response: $response"
        exit 1
    fi

    echo "$product_id"
}

# Function to create price
create_price() {
    local product_id="$1"
    local currency="usd"
    local unit_amount="$2"
    local recurring="${3:-}"
    local metadata="${4:-}"

    local data="product=$product_id&currency=$currency&unit_amount=$unit_amount"

    if [ -n "$recurring" ]; then
        data="$data&recurring[interval]=$recurring"
    fi

    if [ -n "$metadata" ]; then
        data="$data&$metadata"
    fi

    local response=$(stripe_api "POST" "/prices" "$data")
    local price_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')

    if [ -z "$price_id" ]; then
        echo "❌ Failed to create price for product: $product_id"
        echo "Response: $response"
        exit 1
    fi

    echo "$price_id"
}

echo -e "\n📦 Creating Credit Pack Products..."

# Starter Credits - $9.99 for 100 credits
echo "Creating Starter Credits pack..."
STARTER_PRODUCT_ID=$(create_product "Starter Credits Pack" "100 processing credits perfect for trying out")
STARTER_PRICE_ID=$(create_price "$STARTER_PRODUCT_ID" "999" "" "metadata[credits]=100")
echo "✅ Starter Credits: $STARTER_PRICE_ID (Product: $STARTER_PRODUCT_ID)"

# Pro Credits - $29.99 for 500 credits
echo "Creating Pro Credits pack..."
PRO_PRODUCT_ID=$(create_product "Pro Credits Pack" "500 processing credits - best value for regular users")
PRO_PRICE_ID=$(create_price "$PRO_PRODUCT_ID" "2999" "" "metadata[credits]=500")
echo "✅ Pro Credits: $PRO_PRICE_ID (Product: $PRO_PRODUCT_ID)"

# Enterprise Credits - $99.99 for 2000 credits
echo "Creating Enterprise Credits pack..."
ENTERPRISE_PRODUCT_ID=$(create_product "Enterprise Credits Pack" "2000 processing credits for power users")
ENTERPRISE_PRICE_ID=$(create_price "$ENTERPRISE_PRODUCT_ID" "9999" "" "metadata[credits]=2000")
echo "✅ Enterprise Credits: $ENTERPRISE_PRICE_ID (Product: $ENTERPRISE_PRODUCT_ID)"

echo -e "\n🔄 Creating Subscription Products..."

# Hobby Monthly - $19/month for 200 credits
echo "Creating Hobby Monthly subscription..."
HOBBY_PRODUCT_ID=$(create_product "Hobby Plan" "For personal projects - 200 credits per month")
HOBBY_PRICE_ID=$(create_price "$HOBBY_PRODUCT_ID" "1900" "month" "metadata[credits_per_month]=200")
echo "✅ Hobby Monthly: $HOBBY_PRICE_ID (Product: $HOBBY_PRODUCT_ID)"

# Pro Monthly - $49/month for 1000 credits
echo "Creating Pro Monthly subscription..."
PRO_MONTHLY_PRODUCT_ID=$(create_product "Professional Plan" "For professionals - 1000 credits per month")
PRO_MONTHLY_PRICE_ID=$(create_price "$PRO_MONTHLY_PRODUCT_ID" "4900" "month" "metadata[credits_per_month]=1000")
echo "✅ Pro Monthly: $PRO_MONTHLY_PRICE_ID (Product: $PRO_MONTHLY_PRODUCT_ID)"

# Business Monthly - $149/month for 5000 credits
echo "Creating Business Monthly subscription..."
BUSINESS_PRODUCT_ID=$(create_product "Business Plan" "For teams and agencies - 5000 credits per month")
BUSINESS_PRICE_ID=$(create_price "$BUSINESS_PRODUCT_ID" "14900" "month" "metadata[credits_per_month]=5000")
echo "✅ Business Monthly: $BUSINESS_PRICE_ID (Product: $BUSINESS_PRODUCT_ID)"

echo -e "\n🔧 Updating shared/config/stripe.ts with real Price IDs..."

# Update the stripe.ts file with real Price IDs
cat > shared/config/stripe.ts << 'EOF'
/**
 * Centralized Stripe Payment Configuration
 *
 * This file contains all Stripe pricing and product configuration.
 * Price IDs are automatically created and updated by create-stripe-products.sh
 */

// Static Stripe Price IDs - Auto-generated from Stripe API
export const STRIPE_PRICES = {
EOF

# Add the real price IDs to the file
echo "  // Credit Packs (One-time payments)" >> shared/config/stripe.ts
echo "  STARTER_CREDITS: '$STARTER_PRICE_ID'," >> shared/config/stripe.ts
echo "  PRO_CREDITS: '$PRO_PRICE_ID'," >> shared/config/stripe.ts
echo "  ENTERPRISE_CREDITS: '$ENTERPRISE_PRICE_ID'," >> shared/config/stripe.ts
echo "" >> shared/config/stripe.ts
echo "  // Subscriptions (Recurring payments)" >> shared/config/stripe.ts
echo "  HOBBY_MONTHLY: '$HOBBY_PRICE_ID'," >> shared/config/stripe.ts
echo "  PRO_MONTHLY: '$PRO_MONTHLY_PRICE_ID'," >> shared/config/stripe.ts
echo "  BUSINESS_MONTHLY: '$BUSINESS_PRICE_ID'," >> shared/config/stripe.ts
echo "} as const;" >> shared/config/stripe.ts

# Append the rest of the file
cat >> shared/config/stripe.ts << 'EOF'

export type StripePriceKey = keyof typeof STRIPE_PRICES;

/**
 * Credit pack configuration with associated credits
 */
export const CREDIT_PACKS = {
  STARTER_CREDITS: {
    name: 'Starter Pack',
    description: 'Perfect for trying out',
    price: 9.99,
    credits: 100,
    features: ['100 processing credits', 'Valid for 12 months', 'Email support', 'Basic features'],
  },
  PRO_CREDITS: {
    name: 'Pro Pack',
    description: 'Best value for regular users',
    price: 29.99,
    credits: 500,
    features: [
      '500 processing credits',
      'Valid for 12 months',
      'Priority email support',
      'All features included',
      '40% more credits',
    ],
    recommended: true,
  },
  ENTERPRISE_CREDITS: {
    name: 'Enterprise Pack',
    description: 'For power users',
    price: 99.99,
    credits: 2000,
    features: [
      '2000 processing credits',
      'Valid for 12 months',
      '24/7 priority support',
      'All features included',
      'Best value per credit',
    ],
  },
} as const;

/**
 * Subscription plan configuration
 */
export const SUBSCRIPTION_PLANS = {
  HOBBY_MONTHLY: {
    name: 'Hobby',
    description: 'For personal projects',
    price: 19,
    interval: 'month' as const,
    creditsPerMonth: 200,
    features: [
      '200 credits per month',
      'Rollover unused credits',
      'Email support',
      'All features included',
    ],
  },
  PRO_MONTHLY: {
    name: 'Professional',
    description: 'For professionals',
    price: 49,
    interval: 'month' as const,
    creditsPerMonth: 1000,
    features: [
      '1000 credits per month',
      'Rollover unused credits',
      'Priority support',
      'All features included',
      'Early access to new features',
    ],
    recommended: true,
  },
  BUSINESS_MONTHLY: {
    name: 'Business',
    description: 'For teams and agencies',
    price: 149,
    interval: 'month' as const,
    creditsPerMonth: 5000,
    features: [
      '5000 credits per month',
      'Rollover unused credits',
      '24/7 priority support',
      'All features included',
      'Dedicated account manager',
      'Custom integrations',
    ],
  },
} as const;

/**
 * Check if Stripe prices are configured
 */
export function isStripePricesConfigured(): boolean {
  return true; // Always return true for static configuration
}

/**
 * Get the price ID for a given key, with validation
 */
export function getPriceId(key: StripePriceKey): string {
  const priceId = STRIPE_PRICES[key];
  if (!priceId || priceId.includes('000000000000000000000')) {
    console.warn(`Stripe Price ID for ${key} is not properly configured.`);
  }
  return priceId;
}

/**
 * Homepage pricing tiers - derived from subscription plans
 * Used by Pricing.tsx on homepage
 */
export const HOMEPAGE_TIERS = [
  {
    name: 'Free Tier',
    price: '$0',
    priceValue: 0,
    period: '/mo',
    description: 'For testing and personal use.',
    features: [
      '10 images per month',
      '2x & 4x Upscaling',
      'Basic Enhancement',
      'No watermark',
      '5MB file limit',
    ],
    cta: 'Start for Free',
    variant: 'outline' as const,
    priceId: null, // No Stripe price for free tier
    recommended: false,
  },
  {
    name: SUBSCRIPTION_PLANS.HOBBY_MONTHLY.name,
    price: `$${SUBSCRIPTION_PLANS.HOBBY_MONTHLY.price}`,
    priceValue: SUBSCRIPTION_PLANS.HOBBY_MONTHLY.price,
    period: '/mo',
    description: SUBSCRIPTION_PLANS.HOBBY_MONTHLY.description,
    features: SUBSCRIPTION_PLANS.HOBBY_MONTHLY.features,
    cta: 'Get Started',
    variant: 'secondary' as const,
    priceId: STRIPE_PRICES.HOBBY_MONTHLY,
    recommended: false,
  },
  {
    name: SUBSCRIPTION_PLANS.PRO_MONTHLY.name,
    price: `$${SUBSCRIPTION_PLANS.PRO_MONTHLY.price}`,
    priceValue: SUBSCRIPTION_PLANS.PRO_MONTHLY.price,
    period: '/mo',
    description: SUBSCRIPTION_PLANS.PRO_MONTHLY.description,
    features: SUBSCRIPTION_PLANS.PRO_MONTHLY.features,
    cta: 'Get Started',
    variant: 'primary' as const,
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    recommended: true,
  },
] as const;
EOF

echo -e "\n✅ SUCCESS! Stripe products and prices created successfully!"
echo "📋 Summary:"
echo "   Starter Credits: $STARTER_PRICE_ID (\$9.99 for 100 credits)"
echo "   Pro Credits: $PRO_PRICE_ID (\$29.99 for 500 credits)"
echo "   Enterprise Credits: $ENTERPRISE_PRICE_ID (\$99.99 for 2000 credits)"
echo "   Hobby Monthly: $HOBBY_PRICE_ID (\$19/month for 200 credits)"
echo "   Pro Monthly: $PRO_MONTHLY_PRICE_ID (\$49/month for 1000 credits)"
echo "   Business Monthly: $BUSINESS_PRICE_ID (\$149/month for 5000 credits)"
echo ""
echo "🔧 Configuration updated in: shared/config/stripe.ts"
echo "🚀 Ready to test payments!"