'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StripeService } from '@client/services/stripeService';
import { getPlanForPriceId } from '@shared/config/stripe';
import { ModalHeader } from './ModalHeader';
import { PlanComparisonCard } from './PlanComparisonCard';
import { ProrationCard } from './ProrationCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

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

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const previewData = await StripeService.previewSubscriptionChange(targetPriceId);
      setPreview(previewData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to preview subscription change';
      setError(errorMessage);
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetPriceId]);

  useEffect(() => {
    if (isOpen && targetPriceId) {
      loadPreview();
    }
  }, [isOpen, targetPriceId, loadPreview]);

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
        <ModalHeader
          title={currentPlan ? 'Change Plan' : 'Select Plan'}
          icon={Icon}
          iconClassName={isUpgrade ? 'text-green-600' : 'text-orange-600'}
          onClose={onClose}
          disabled={changing}
        />

        <div className="p-6">
          {loading && <LoadingSpinner message="Calculating plan changes..." />}

          {error && <ErrorAlert message={error} className="mb-6" />}

          {preview && !loading && preview.new_plan && (
            <>
              {/* Plan Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {preview.current_plan && (
                  <PlanComparisonCard
                    title="Current Plan"
                    name={preview.current_plan.name}
                    creditsPerMonth={preview.current_plan.credits_per_month}
                    variant="current"
                  />
                )}

                <PlanComparisonCard
                  title="New Plan"
                  name={preview.new_plan.name}
                  creditsPerMonth={preview.new_plan.credits_per_month}
                  variant={isUpgrade ? 'upgrade' : 'downgrade'}
                  effectiveText={preview.effective_immediately ? 'Immediately' : 'Next billing cycle'}
                />
              </div>

              {/* Proration Details */}
              {preview.current_plan && (
                <ProrationCard amountDue={preview.proration.amount_due} />
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
