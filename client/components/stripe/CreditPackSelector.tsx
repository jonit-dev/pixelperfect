'use client';

import React, { useState } from 'react';
import { getEnabledCreditPacks } from '@shared/config/subscription.utils';
import type { ICreditPack } from '@shared/config/subscription.types';
import { CreditCard, Check } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

interface ICreditPackSelectorProps {
  onPurchaseStart?: () => void;
  onPurchaseComplete?: () => void;
  onError?: (error: Error) => void;
}

export function CreditPackSelector({
  onPurchaseStart,
  onPurchaseComplete,
}: ICreditPackSelectorProps): JSX.Element {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const packs = getEnabledCreditPacks();

  const handlePurchase = (pack: ICreditPack) => {
    setSelectedPack(pack.key);
    setSelectedPriceId(pack.stripePriceId);
    setShowCheckoutModal(true);
    onPurchaseStart?.();
  };

  const handleCheckoutClose = () => {
    setShowCheckoutModal(false);
    setSelectedPack(null);
    setSelectedPriceId(null);
  };

  const handleCheckoutSuccess = () => {
    onPurchaseComplete?.();
    handleCheckoutClose();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getPricePerCredit = (pack: ICreditPack) => {
    return (pack.priceInCents / pack.credits / 100).toFixed(3);
  };

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {packs.map(pack => (
          <div
            key={pack.key}
            className={`relative bg-white border rounded-xl p-6 transition-all cursor-pointer hover:border-indigo-500 hover:shadow-md ${
              selectedPack === pack.key ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200'
            } ${pack.popular ? 'border-indigo-300' : ''}`}
            onClick={() => handlePurchase(pack)}
          >
          {pack.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
              Best Value
            </div>
          )}

          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{pack.name}</h3>
            <div className="text-3xl font-bold text-slate-900 mt-2">{formatPrice(pack.priceInCents)}</div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-2xl font-semibold text-indigo-600">{pack.credits} credits</div>

            <div className="text-sm text-slate-500">${getPricePerCredit(pack)} per credit</div>

            <ul className="text-sm text-left space-y-2 mt-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Never expire</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Use anytime</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Stack with subscription</span>
              </li>
            </ul>

            <button
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors mt-4 ${
                pack.popular
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Buy Now</span>
              </div>
            </button>
          </div>
        </div>
      ))}
    </div>

    {showCheckoutModal && selectedPriceId && (
      <CheckoutModal
        priceId={selectedPriceId}
        onClose={handleCheckoutClose}
        onSuccess={handleCheckoutSuccess}
      />
    )}
    </>
  );
}
