import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@server/stripe';
import { supabaseAdmin } from '@server/supabase/supabaseAdmin';
import { serverEnv } from '@shared/config/env';
import { getPlanForPriceId } from '@shared/config/stripe';

export const runtime = 'edge';

interface ISubscriptionChangeRequest {
  targetPriceId: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing authorization header'
          }
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token'
          }
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: ISubscriptionChangeRequest;
    try {
      const text = await request.text();
      body = JSON.parse(text) as ISubscriptionChangeRequest;
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        },
        { status: 400 }
      );
    }

    if (!body.targetPriceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PRICE_ID',
            message: 'targetPriceId is required'
          }
        },
        { status: 400 }
      );
    }

    // 3. Validate target price ID
    const targetPlan = getPlanForPriceId(body.targetPriceId);
    if (!targetPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PRICE_ID',
            message: 'Invalid or unsupported price ID'
          }
        },
        { status: 400 }
      );
    }

    // 4. Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 5. Check if this is actually a change
    if (!subError && currentSubscription && currentSubscription.price_id === body.targetPriceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SAME_PLAN',
            message: 'Target plan is the same as current plan'
          }
        },
        { status: 400 }
      );
    }

    // 6. Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_CUSTOMER_NOT_FOUND',
            message: 'User has no Stripe customer ID'
          }
        },
        { status: 400 }
      );
    }

    // 7. Handle subscription change
    if (subError || !currentSubscription) {
      // No current subscription - create new one
      // This should go through the regular checkout flow instead
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found. Use checkout endpoint instead.'
          }
        },
        { status: 400 }
      );
    }

    // Existing subscription - modify it
    try {
      // Check if we're in test mode
      if (serverEnv.STRIPE_SECRET_KEY?.includes('dummy_key') || serverEnv.ENV === 'test') {
        // Mock subscription change for testing
        console.log(`[TEST MODE] Would change subscription ${currentSubscription.id} to price ${body.targetPriceId}`);

        // Update local database to simulate the change
        await supabaseAdmin
          .from('subscriptions')
          .update({
            price_id: body.targetPriceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSubscription.id);

        return NextResponse.json({
          success: true,
          data: {
            subscription_id: currentSubscription.id,
            status: 'active',
            new_price_id: body.targetPriceId,
            effective_immediately: true,
            mock: true,
          }
        });
      }

      // Real Stripe subscription modification
      const subscription = await stripe.subscriptions.retrieve(currentSubscription.id);

      // Update the subscription
      const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
        items: [{
          id: subscription.items.data[0]?.id,
          price: body.targetPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update local database with new price ID
      await supabaseAdmin
        .from('subscriptions')
        .update({
          price_id: body.targetPriceId,
          current_period_start: new Date((updatedSubscription as any).current_period_start! * 1000).toISOString(),
          current_period_end: new Date((updatedSubscription as any).current_period_end! * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id);

      return NextResponse.json({
        success: true,
        data: {
          subscription_id: updatedSubscription.id,
          status: updatedSubscription.status,
          new_price_id: body.targetPriceId,
          effective_immediately: true,
          current_period_start: new Date((updatedSubscription as any).current_period_start! * 1000).toISOString(),
          current_period_end: new Date((updatedSubscription as any).current_period_end! * 1000).toISOString(),
        }
      });

    } catch (stripeError: unknown) {
      console.error('Stripe subscription change error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_ERROR',
            message: `Failed to change subscription: ${errorMessage}`
          }
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Subscription change error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage
        }
      },
      { status: 500 }
    );
  }
}