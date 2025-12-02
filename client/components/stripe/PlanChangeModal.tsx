'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { StripeService } from '@client/services/stripeService';
import { getPlanForPriceId } from '@shared/config/stripe';

interface IPlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPriceId: string;
  currentPriceId?: string;
  onComplete?: () => void;
}

interface IPreviewData {
  proration: {
    amount_due: number;
    currency: string;
    period_start: string;
    period_end: string;
  };
  current_plan: {
    name: string;
    price_id: string;
    credits_per_month: number;
  } | null;
  new_plan: {
    name: string;
    price_id: string;
    credits_per_month: number;
  };
  effective_immediately: boolean;
}

export function PlanChangeModal({
  isOpen,
  onClose,
  targetPriceId,
  currentPriceId,
  onComplete,
}: IPlanChangeModalProps): JSX.Element {
  const [preview, setPreview] = useState<IPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetPlan = getPlanForPriceId(targetPriceId);
  const currentPlan = currentPriceId ? getPlanForPriceId(currentPriceId) : null;

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const previewData = await StripeService.previewSubscriptionChange(targetPriceId);
      setPreview(previewData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview subscription change';
      setError(errorMessage);
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetPriceId) {
      loadPreview();
    }
  }, [isOpen, targetPriceId]);

  const handleConfirmChange = async () => {
    try {
      setChanging(true);
      setError(null);

      await StripeService.changeSubscription(targetPriceId);

      // Close modal and notify completion
      onClose();
      onComplete?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change subscription';
      setError(errorMessage);
      console.error('Change error:', err);
    } finally {
      setChanging(false);
    }
  };

  if (!isOpen || !targetPlan) return <></>;

  const isUpgrade = currentPlan ? targetPlan.creditsPerMonth > currentPlan.creditsPerMonth : true;
  const Icon = isUpgrade ? TrendingUp : TrendingDown;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${isUpgrade ? 'text-green-600' : 'text-orange-600'}`} />
            <h2 className="text-xl font-semibold text-gray-900">
              {currentPlan ? 'Change Plan' : 'Select Plan'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={changing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating plan changes...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {preview && !loading && preview.new_plan && (
            <>
              {/* Plan Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Current Plan */}
                {preview.current_plan && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Current Plan</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium">{preview.current_plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credits:</span>
                        <span>{preview.current_plan.credits_per_month.toLocaleString()}/month</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Plan */}
                <div className={`border rounded-lg p-4 ${isUpgrade ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                  <h3 className="font-medium text-gray-900 mb-2">New Plan</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{preview.new_plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credits:</span>
                      <span>{preview.new_plan.credits_per_month.toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective:</span>
                      <span className="text-sm">
                        {preview.effective_immediately ? 'Immediately' : 'Next billing cycle'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proration Details */}
              {preview.current_plan && (
                <div className={`border rounded-lg p-4 mb-6 ${
                  preview.proration.amount_due > 0
                    ? 'border-blue-200 bg-blue-50'
                    : preview.proration.amount_due < 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-2">Billing Adjustment</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Proration amount:</span>
                      <span className={`font-medium ${
                        preview.proration.amount_due > 0
                          ? 'text-blue-900'
                          : preview.proration.amount_due < 0
                          ? 'text-green-900'
                          : 'text-gray-900'
                      }`}>
                        {preview.proration.amount_due > 0 ? '+' : ''}
                        ${(preview.proration.amount_due / 100).toFixed(2)}
                      </span>
                    </div>
                    {preview.proration.amount_due !== 0 && (
                      <p className="text-sm text-gray-600">
                        {preview.proration.amount_due > 0
                          ? 'This amount will be charged immediately'
                          : 'This amount will be credited to your account'
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={changing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmChange}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${
                    isUpgrade
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={changing}
                >
                  {changing ? 'Processing...' : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}