'use client';

import { AlertTriangle } from 'lucide-react';

interface IErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
}

/**
 * Error alert component for displaying error messages
 */
export function ErrorAlert({
  title = 'Error',
  message,
  className = '',
}: IErrorAlertProps): JSX.Element {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-red-900">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
