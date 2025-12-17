import React from 'react';
import Link from 'next/link';
import type { ProcessingMode } from '@shared/config/subscription.types';
import { calculateModelCreditCost, getCreditCostForMode } from '@shared/config/subscription.utils';

export interface ICreditCostPreviewProps {
  queueLength: number;
  mode: ProcessingMode;
  currentBalance: number;
  selectedModel?: string;
  scale?: 2 | 4 | 8;
}

export const CreditCostPreview = ({
  queueLength,
  mode,
  currentBalance,
  selectedModel = 'auto',
  scale = 2,
}: ICreditCostPreviewProps): JSX.Element | null => {
  // For 'auto' model, use base mode cost; otherwise calculate with model multiplier
  const isAutoModel = selectedModel === 'auto';
  const costPerImage = isAutoModel
    ? getCreditCostForMode(mode)
    : calculateModelCreditCost({ mode, modelId: selectedModel, scale });
  const totalCost = queueLength * costPerImage;
  const hasEnough = currentBalance >= totalCost;
  const deficit = totalCost - currentBalance;

  console.log('[CreditCostPreview] Rendering:', {
    queueLength,
    mode,
    selectedModel,
    scale,
    currentBalance,
    costPerImage,
    totalCost,
    hasEnough,
    deficit,
  });

  if (queueLength === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        hasEnough
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estimated cost:
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {totalCost} {totalCost === 1 ? 'credit' : 'credits'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Your balance:</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {currentBalance} {currentBalance === 1 ? 'credit' : 'credits'}
          </span>
        </div>
        {!hasEnough && (
          <div className="mt-3 space-y-1 border-t border-amber-300 pt-3 dark:border-amber-700">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Need {deficit} more {deficit === 1 ? 'credit' : 'credits'}
            </p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-medium text-amber-800 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
            >
              Upgrade to continue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
