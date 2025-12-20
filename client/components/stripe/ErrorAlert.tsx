'use client';

import { AlertTriangle } from 'lucide-react';

interface IErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Error alert component for displaying error messages
 */
export function ErrorAlert({
  title = 'Error',
  message,
  className = '',
  onClick,
}: IErrorAlertProps): JSX.Element {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}${onClick ? ' cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-medium text-red-900">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        {onClick && <span className="text-red-400 hover:text-red-600 text-sm font-medium">×</span>}
      </div>
    </div>
  );
}
