'use client';

interface ILoadingSpinnerProps {
  message?: string;
  className?: string;
}

/**
 * Loading spinner component for async operations
 */
export function LoadingSpinner({
  message = 'Loading...',
  className = '',
}: ILoadingSpinnerProps): JSX.Element {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
      <p className="text-slate-600">{message}</p>
    </div>
  );
}
