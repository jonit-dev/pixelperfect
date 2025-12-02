/**
 * Script to manually fix missing subscription records
 * This retrieves subscription data from Stripe and creates the database record
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.api
dotenv.config({ path: '.env.api' });
dotenv.config({ path: '.env.client' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  STRIPE_SECRET_KEY:', !!STRIPE_SECRET_KEY);
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixSubscription(customerId: string) {
  console.log(`Fetching subscriptions for customer: ${customerId}`);

  // Get all subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
  });

  console.log(`Found ${subscriptions.data.length} subscriptions`);

  for (const subscription of subscriptions.data) {
    console.log(`\nProcessing subscription: ${subscription.id}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Price ID: ${subscription.items.data[0]?.price.id}`);
    console.log(`  Current period: ${new Date(subscription.current_period_start * 1000)} - ${new Date(subscription.current_period_end * 1000)}`);

    // Get the user_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_status')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profileError || !profile) {
      console.error('  ❌ No profile found for customer');
      continue;
    }

    const userId = profile.id;
    const priceId = subscription.items.data[0]?.price.id || '';

    console.log(`  User ID: ${userId}`);

    // Convert timestamps
    const currentPeriodStartISO = dayjs.unix(subscription.current_period_start).toISOString();
    const currentPeriodEndISO = dayjs.unix(subscription.current_period_end).toISOString();
    const canceledAtISO = subscription.canceled_at
      ? dayjs.unix(subscription.canceled_at).toISOString()
      : null;

    // Upsert subscription
    const { error: subError } = await supabase.from('subscriptions').upsert({
      id: subscription.id,
      user_id: userId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: currentPeriodStartISO,
      current_period_end: currentPeriodEndISO,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: canceledAtISO,
    });

    if (subError) {
      console.error('  ❌ Error upserting subscription:', subError);
      continue;
    }

    console.log('  ✅ Subscription record created/updated');

    // Determine plan name from price ID
    let planName = 'Unknown';
    if (priceId.includes('1SZmVzALMLhQocpfPyRX2W8D') || priceId.includes('1SZmWBALMLhQocpfPyRX2W8D')) {
      planName = 'Hobby';
    } else if (priceId.includes('1SZmXCALMLhQocpfcBm3aMXz') || priceId.includes('1SZmXcALMLhQocpfcBm3aMXz')) {
      planName = 'Pro';
    } else if (priceId.includes('1SZmY0ALMLhQocpfY0ALMLhQ') || priceId.includes('1SZmY0ALMLhQocpfY0ALMLhQ')) {
      planName = 'Enterprise';
    }

    // Update profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_tier: planName,
      })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('  ❌ Error updating profile:', profileUpdateError);
    } else {
      console.log(`  ✅ Profile updated - tier: ${planName}, status: ${subscription.status}`);
    }
  }
}

// Run the script
const customerId = process.argv[2];

if (!customerId) {
  console.error('Usage: tsx scripts/fix-subscription.ts <customer_id>');
  process.exit(1);
}

fixSubscription(customerId)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
