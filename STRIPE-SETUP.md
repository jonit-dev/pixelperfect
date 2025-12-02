# Stripe Payment Setup

This project is configured with centralized Stripe payment processing.

## 🚀 Quick Start

### 1. Environment Variables
Your Stripe credentials are already configured in `.env`:
- `STRIPE_SECRET_KEY` - Server-side secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side publishable key

### 2. One-Time Setup (if needed)
```bash
# Create all Stripe products and prices automatically
yarn stripe:setup
```

### 3. Development Server
```bash
# Start development with Stripe webhooks
yarn dev

# Or without webhooks
yarn dev:no-webhooks
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `yarn stripe:setup` | Create all Stripe products and prices |
| `yarn stripe:listen` | Start webhook listener for development |
| `yarn stripe:check` | Check environment variables |
| `yarn dev` | Start development server with webhooks |
| `yarn dev:no-webhooks` | Start development without webhooks |

## 💳 Current Products

### ✅ Working Product
- **Starter Credits**: `$9.99` for 100 credits - **READY TO USE**
  - Price ID: `price_1SZm65ALMLhQocpfwl81qyuh`

### 📝 Configuration Location
All Stripe configuration is centralized in: `shared/config/stripe.ts`

## 🔧 How It Works

1. **Centralized Configuration**: All Price IDs are in `shared/config/stripe.ts`
2. **Environment Loading**: `scripts/load-env.sh` loads environment variables
3. **Product Creation**: `scripts/stripe-product-sync.sh` creates Stripe products
4. **Type Safety**: Full TypeScript support with price validation

## 🚀 Testing Payments

1. Start the development server: `yarn dev`
2. Navigate to the pricing page
3. Try purchasing "Starter Credits" - this will work with the real Stripe product

## 📝 Next Steps

For additional products, either:
1. Run `yarn stripe:setup` to create all remaining products automatically
2. Create products manually in Stripe Dashboard: https://dashboard.stripe.com/test/products
3. Update `shared/config/stripe.ts` with new Price IDs

## 🔗 Useful Links

- **Stripe Dashboard**: https://dashboard.stripe.com/test/dashboard
- **Products**: https://dashboard.stripe.com/test/products
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Test Cards**: https://stripe.com/docs/testing#cards