'use client';

import { useState } from 'react';
import { useToastStore } from '@client/store/toastStore';
import { CheckoutModal } from '@client/components/stripe/CheckoutModal';

interface IPricingCardProps {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval?: 'month' | 'year';
  features: readonly string[];
  priceId: string;
  recommended?: boolean;
}

/**
 * Pricing card component for displaying subscription plans only
 *
 * Usage:
 * ```tsx
 * <PricingCard
 *   name="Pro Plan"
 *   description="Perfect for professionals"
 *   price={29}
 *   interval="month"
 *   features={["1000 credits per month", "Priority support"]}
 *   priceId="price_XXX"
 *   recommended={true}
 * />
 * ```
 */
export function PricingCard({
  name,
  description,
  price,
  currency = 'USD',
  interval,
  features,
  priceId,
  recommended = false,
}: IPricingCardProps): JSX.Element {
  const [showCheckout, setShowCheckout] = useState(false);
  const { showToast } = useToastStore();

  const handleSubscribe = () => {
    // Check if user is authenticated by trying to get session
    // The CheckoutModal will handle the actual auth check
    setShowCheckout(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
  };

  const handleCheckoutSuccess = () => {
    showToast({
      message: 'Subscription activated successfully!',
      type: 'success',
    });
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg border-2 ${recommended ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20' : 'border-slate-200'}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Recommended
        </div>
      )}
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">{name}</h2>
        {description && <p className="text-center text-sm text-slate-600 mb-6">{description}</p>}

        <div className="text-center my-6">
          <div className="text-4xl font-bold text-slate-900">
            {currency === 'USD' ? '$' : currency}
            {price}
          </div>
          {interval && <div className="text-sm text-slate-600 mt-1">per {interval}</div>}
        </div>

        <div className="border-t border-slate-200 pt-6 mb-6"></div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <button
            onClick={handleSubscribe}
            className="w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
          >
            Subscribe Now
          </button>
        </div>
      </div>

      {/* Embedded Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          priceId={priceId}
          onClose={handleCheckoutClose}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
