'use client';

import { useState } from 'react';
import { StripeService } from '@/lib/stripe';

interface BuyCreditsButtonProps {
  priceId: string;
  creditsAmount: number;
  price: number;
  currency?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Button component to initiate credit purchase
 *
 * Usage:
 * ```tsx
 * <BuyCreditsButton
 *   priceId="price_XXX"
 *   creditsAmount={100}
 *   price={9.99}
 *   currency="USD"
 * />
 * ```
 */
export function BuyCreditsButton({
  priceId,
  creditsAmount,
  price,
  currency = 'USD',
  className = '',
  onSuccess,
  onError,
}: BuyCreditsButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      await StripeService.redirectToCheckout(priceId, {
        metadata: {
          credits_amount: creditsAmount.toString(),
        },
        successUrl: `${window.location.origin}/success?credits=${creditsAmount}`,
        cancelUrl: window.location.href,
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Purchase error:', error);
      onError?.(error);
      alert(error.message || 'Failed to initiate purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`btn btn-primary ${loading ? 'loading' : ''} ${className}`}
    >
      {loading ? (
        'Processing...'
      ) : (
        <>
          Buy {creditsAmount} Credits - {currency} ${price.toFixed(2)}
        </>
      )}
    </button>
  );
}
