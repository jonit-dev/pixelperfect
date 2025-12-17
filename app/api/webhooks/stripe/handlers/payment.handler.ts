import { supabaseAdmin } from '@server/supabase/supabaseAdmin';
import { stripe } from '@server/stripe';
import { assertKnownPriceId, getPlanForPriceId } from '@shared/config/stripe';
import Stripe from 'stripe';

// Charge interface for accessing invoice property
interface IStripeChargeExtended extends Stripe.Charge {
  invoice?: string | null | undefined;
}

export class PaymentHandler {
  /**
   * Handle successful checkout session
   */
  static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in session metadata');
      return;
    }

    console.log(`Checkout completed for user ${userId}, mode: ${session.mode}`);

    if (session.mode === 'subscription') {
      // For subscriptions, add initial credits immediately since user lands on success page
      // The subscription will be fully set up by the subscription.created event
      const subscriptionId = session.subscription as string;

      if (subscriptionId) {
        try {
          // Check if this is a test subscription ID
          if (subscriptionId.startsWith('sub_test_')) {
            console.log('Test subscription detected, using mock data');

            // For test subscriptions, add credits based on session metadata or a default
            const testPriceId = 'price_1SZmVzALMLhQocpfPyRX2W8D'; // Default to PRO_MONTHLY for testing
            let plan;
            try {
              const resolved = assertKnownPriceId(testPriceId);
              if (resolved.type !== 'plan') {
                throw new Error(`Test price ID ${testPriceId} is not a subscription plan`);
              }
              plan = getPlanForPriceId(testPriceId); // Still use this for the legacy format
            } catch (error) {
              console.error('Test subscription plan resolution failed:', error);
              // Continue with mock plan data
            }

            if (plan) {
              const { error } = await supabaseAdmin.rpc('add_subscription_credits', {
                target_user_id: userId,
                amount: plan.creditsPerMonth,
                ref_id: session.id,
                description: `Test subscription credits - ${plan.name} plan - ${plan.creditsPerMonth} credits`,
              });

              if (error) {
                console.error('Error adding test subscription credits:', error);
              } else {
                console.log(
                  `Added ${plan.creditsPerMonth} test subscription credits to user ${userId} for ${plan.name} plan`
                );
              }
            }
          } else {
            // MEDIUM-5 FIX: Real subscription - get details from Stripe
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;

            // Get the invoice ID from the session for proper reference tracking
            const invoiceId = session.invoice as string | null;

            if (priceId) {
              let plan;
              try {
                const resolved = assertKnownPriceId(priceId);
                if (resolved.type !== 'plan') {
                  throw new Error(
                    `Price ID ${priceId} in checkout session is not a subscription plan`
                  );
                }
                plan = getPlanForPriceId(priceId); // Still use this for the legacy format
              } catch (error) {
                console.error(
                  `[WEBHOOK_ERROR] Checkout session plan resolution failed: ${priceId}`,
                  {
                    error: error instanceof Error ? error.message : error,
                    subscriptionId,
                    sessionId: session.id,
                    userId,
                  }
                );
                // For checkout sessions, we'll continue without failing since the subscription.created event will handle it
                return;
              }
              if (plan) {
                // Add initial credits for the first month
                // Use invoice ID as ref_id for refund correlation
                const { error } = await supabaseAdmin.rpc('add_subscription_credits', {
                  target_user_id: userId,
                  amount: plan.creditsPerMonth,
                  ref_id: invoiceId ? `invoice_${invoiceId}` : `session_${session.id}`,
                  description: `Initial subscription credits - ${plan.name} plan - ${plan.creditsPerMonth} credits`,
                });

                if (error) {
                  console.error('Error adding initial subscription credits:', error);
                } else {
                  console.log(
                    `Added ${plan.creditsPerMonth} initial subscription credits to user ${userId} for ${plan.name} plan`
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing subscription checkout:', error);
        }
      }
    } else if (session.mode === 'payment') {
      // Handle credit pack purchase
      await this.handleCreditPackPurchase(session, userId);
    } else {
      console.warn(
        `Unexpected checkout mode: ${session.mode} for session ${session.id}. Expected 'subscription' or 'payment'.`
      );
    }
  }

  /**
   * Handle one-time credit pack purchase
   */
  private static async handleCreditPackPurchase(
    session: Stripe.Checkout.Session,
    userId: string
  ): Promise<void> {
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const packKey = session.metadata?.pack_key;

    if (!credits || credits <= 0) {
      console.error(`Invalid credits in session metadata: ${session.metadata?.credits}`);
      return;
    }

    // Get payment intent for refund correlation
    const paymentIntentId = session.payment_intent as string;

    try {
      const { error } = await supabaseAdmin.rpc('add_purchased_credits', {
        target_user_id: userId,
        amount: credits,
        ref_id: paymentIntentId ? `pi_${paymentIntentId}` : `session_${session.id}`,
        description: `Credit pack purchase - ${packKey || 'unknown'} - ${credits} credits`,
      });

      if (error) {
        console.error('Error adding purchased credits:', error);
        throw error; // Trigger webhook retry
      }

      console.log(`Added ${credits} purchased credits to user ${userId} (pack: ${packKey})`);
    } catch (error) {
      console.error('Failed to process credit purchase:', error);
      throw error; // Re-throw for webhook retry
    }
  }

  /**
   * Handle charge refund - clawback credits
   */
  static async handleChargeRefunded(charge: IStripeChargeExtended): Promise<void> {
    const customerId = charge.customer;
    const refundAmount = charge.amount_refunded || 0;

    if (refundAmount === 0) {
      console.log(`Charge ${charge.id} has no refund amount, skipping`);
      return;
    }

    // Get the user ID from the customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (!profile) {
      console.error(`No profile found for customer ${customerId} for charge refund`);
      return;
    }

    const userId = profile.id;

    console.log(
      `Processing refund for charge ${charge.id}: ${refundAmount} cents for user ${userId}`
    );

    // Get the invoice to find the original credit transaction
    const invoiceId = charge.invoice;

    if (!invoiceId) {
      console.warn(`Charge ${charge.id} has no invoice - cannot clawback credits`);
      // For charges without invoices (one-time payments), we can't easily determine which credits to clawback
      // This is acceptable as our system is subscription-only
      return;
    }

    try {
      // Clawback all credits added from this invoice transaction
      const { data: result, error } = await supabaseAdmin.rpc('clawback_credits_from_transaction', {
        p_target_user_id: userId,
        p_original_ref_id: `invoice_${invoiceId}`,
        p_reason: `Refund for charge ${charge.id} (${refundAmount} cents)`,
      });

      if (error) {
        console.error(`Failed to clawback credits for refund:`, error);
        throw error;
      }

      if (result && result.length > 0) {
        const clawbackResult = result[0];
        if (clawbackResult.success) {
          console.log(
            `Successfully clawed back ${clawbackResult.credits_clawed_back} credits. New balance: ${clawbackResult.new_balance}`
          );
        } else {
          console.error(`Clawback failed: ${clawbackResult.error_message}`);
        }
      }
    } catch (error) {
      console.error(`Error during credit clawback:`, error);
      // Re-throw to mark webhook as failed and trigger retry
      throw error;
    }
  }

  /**
   * Handle invoice payment refunded
   */
  static async handleInvoicePaymentRefunded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Invoice ${invoice.id} payment refunded`);

    // TODO: Implement invoice refund handling logic
    // This would involve clawing back credits from the original invoice transaction
    // Similar to handleChargeRefunded but for invoice refunds
  }
}
