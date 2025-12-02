'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import dayjs from 'dayjs';

interface ICancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  planName: string;
  periodEnd: string;
}

const CANCELLATION_REASONS = [
  'Too expensive',
  'Not using it enough',
  'Missing features I need',
  'Switching to a competitor',
  'Technical issues',
  'Other',
] as const;

/**
 * Modal for canceling a subscription with optional reason
 *
 * Features:
 * - Shows clear information about cancellation (keeps access until period end)
 * - Optional reason selection with custom text input
 * - Confirmation step to prevent accidental cancellations
 *
 * Usage:
 * ```tsx
 * <CancelSubscriptionModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleCancel}
 *   planName="Professional"
 *   periodEnd="2025-03-01"
 * />
 * ```
 */
export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  planName,
  periodEnd,
}: ICancelSubscriptionModalProps): JSX.Element | null {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== 'Other') {
      setCustomReason('');
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const reason = selectedReason === 'Other' ? customReason : selectedReason;
      await onConfirm(reason || undefined);
      onClose();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const formattedEndDate = dayjs(periodEnd).format('MMMM D, YYYY');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Cancel Subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!showConfirmation ? (
            <>
              {/* Cancellation Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>
                    Your {planName} plan will remain active until {formattedEndDate}.
                  </strong>
                  <br />
                  <br />
                  You won&apos;t be charged again, but you&apos;ll keep full access to your
                  subscription benefits until the end of your current billing period.
                </p>
              </div>

              {/* Optional Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Help us improve (optional)
                </label>
                <div className="space-y-2">
                  {CANCELLATION_REASONS.map(reason => (
                    <label
                      key={reason}
                      className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={e => handleReasonChange(e.target.value)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm text-slate-700">{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Reason Input */}
                {selectedReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Please tell us why you're canceling..."
                    className="mt-3 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                  disabled={loading}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  disabled={loading}
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Are you sure?</h3>
                  <p className="text-sm text-slate-600">
                    Your subscription will be canceled and you won&apos;t be charged again after{' '}
                    <strong>{formattedEndDate}</strong>.
                  </p>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                  disabled={loading}
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Canceling...' : 'Yes, Cancel Subscription'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
