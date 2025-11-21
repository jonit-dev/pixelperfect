'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

function SuccessContent(): JSX.Element {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brief loading state to let webhook process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-base-content/70">Processing your payment...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-lg text-base-content/70 mb-8">
            Thank you for your purchase. Your credits have been added to your account
            and are ready to use.
          </p>

          {/* Session ID (for reference) */}
          {sessionId && (
            <div className="bg-base-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-base-content/60">
                Reference: <code className="text-xs">{sessionId.slice(0, 20)}...</code>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link href="/dashboard/billing" className="btn btn-outline">
              View Billing
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-sm text-base-content/60">
            <p>
              A receipt has been sent to your email address.
              <br />
              If you have any questions, please{' '}
              <a href="mailto:support@pixelperfect.com" className="link link-primary">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback(): JSX.Element {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-base-content/70">Loading...</p>
      </div>
    </main>
  );
}

export default function SuccessPage(): JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
