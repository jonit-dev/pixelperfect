'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export default function CanceledPage() {
  return (
    <main className="flex-1">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          {/* Canceled Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200">
              <XCircle className="h-12 w-12 text-base-content/50" />
            </div>
          </div>

          {/* Canceled Message */}
          <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
          <p className="text-lg text-base-content/70 mb-8">
            Your payment was canceled and you have not been charged.
            If you experienced any issues, please don&apos;t hesitate to reach out.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Link>
            <Link href="/dashboard" className="btn btn-outline">
              Go to Dashboard
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-base-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Need Help?</h3>
            </div>
            <p className="text-sm text-base-content/70 mb-4">
              If you have questions about our pricing or need assistance with your purchase,
              our support team is here to help.
            </p>
            <a
              href="mailto:support@pixelperfect.com"
              className="btn btn-sm btn-ghost"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
