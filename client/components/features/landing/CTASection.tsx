'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useModalStore } from '@client/store/modalStore';
import { getSubscriptionConfig } from '@shared/config/subscription.config';
import { clientEnv } from '@shared/config/env';

export const CTASection = (): JSX.Element => {
  const { openAuthModal } = useModalStore();

  // Check if any plan has trial enabled
  const config = getSubscriptionConfig();
  const hasTrialEnabled = config.plans.some(plan => plan.trial.enabled);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface to-accent/10"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Images?
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join over 10,000 businesses using {clientEnv.APP_NAME} to enhance their images. Start your
          free trial today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => openAuthModal('register')}
            className="group inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all duration-300 cta-gradient-cyan hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            {hasTrialEnabled ? 'Start Free Trial' : 'Sign Up Free'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 glass hover:bg-surface/10 text-white font-semibold rounded-xl transition-all duration-300"
          >
            View Pricing
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required &bull; 10 free credits &bull; Cancel anytime
        </p>
      </div>
    </section>
  );
};
