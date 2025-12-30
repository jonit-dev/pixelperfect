'use client';

interface IPlanComparisonCardProps {
  title: string;
  name: string;
  creditsPerMonth: number;
  variant?: 'current' | 'upgrade' | 'downgrade';
  effectiveText?: string;
}

/**
 * Card component showing plan details in comparison views
 */
export function PlanComparisonCard({
  title,
  name,
  creditsPerMonth,
  variant = 'current',
  effectiveText,
}: IPlanComparisonCardProps): JSX.Element {
  const variantStyles = {
    current: 'border-border bg-surface',
    upgrade: 'border-green-200 bg-green-50',
    downgrade: 'border-orange-200 bg-orange-50',
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <h3 className="font-medium text-primary mb-2">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credits:</span>
          <span>{creditsPerMonth.toLocaleString()}/month</span>
        </div>
        {effectiveText && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Effective:</span>
            <span className="text-sm">{effectiveText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
