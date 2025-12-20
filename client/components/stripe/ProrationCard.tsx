'use client';

interface IProrationCardProps {
  amountDue: number;
  currency?: string;
}

/**
 * Card component showing proration/billing adjustment details
 */
export function ProrationCard({ amountDue }: IProrationCardProps): JSX.Element {
  const getVariantStyles = () => {
    if (amountDue > 0) return 'border-blue-200 bg-blue-50';
    if (amountDue < 0) return 'border-green-200 bg-green-50';
    return 'border-white/10 bg-surface';
  };

  const getAmountStyles = () => {
    if (amountDue > 0) return 'text-blue-900';
    if (amountDue < 0) return 'text-green-900';
    return 'text-primary';
  };

  const getMessage = () => {
    if (amountDue > 0) return 'This amount will be charged immediately';
    if (amountDue < 0) return 'This amount will be credited to your account';
    return null;
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getVariantStyles()}`}>
      <h3 className="font-medium text-primary mb-2">Billing Adjustment</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Proration amount:</span>
          <span className={`font-medium ${getAmountStyles()}`}>
            {amountDue > 0 ? '+' : ''}${(amountDue / 100).toFixed(2)}
          </span>
        </div>
        {getMessage() && <p className="text-sm text-muted-foreground">{getMessage()}</p>}
      </div>
    </div>
  );
}
