'use client';

import { useState } from 'react';
import { BookOpen, Mail, MessageCircle, Send } from 'lucide-react';
import { clientEnv } from '@shared/config/env';
import { useTranslations } from 'next-intl';
import { SupportModal } from '@client/components/modal/support';

export default function SupportPage() {
  const t = useTranslations('dashboard.support');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle', { appName: clientEnv.APP_NAME })}
        </p>
      </div>

      {/* Support Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Documentation */}
        <div className="bg-surface rounded-xl border border-border p-6 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-accent" />
          </div>
          <h2 className="font-semibold text-white mb-2">{t('documentation')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('documentationDescription', { appName: clientEnv.APP_NAME })}
          </p>
          <button className="text-accent text-sm font-medium hover:text-accent-hover">
            {t('browseDocs')}
          </button>
        </div>

        {/* FAQ */}
        <div className="bg-surface rounded-xl border border-border p-6 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
            <MessageCircle size={24} className="text-accent" />
          </div>
          <h2 className="font-semibold text-white mb-2">{t('faq')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('faqDescription')}</p>
          <button className="text-accent text-sm font-medium hover:text-accent-hover">
            {t('viewFaq')}
          </button>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
            <Mail size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{t('contactSupport')}</h2>
            <p className="text-sm text-muted-foreground">{t('contactSupportSubtitle')}</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Send size={18} />
          <span>{t('openContactForm')}</span>
        </button>

        <div className="mt-4 p-4 bg-surface-light/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-white">{t('emailSupport')}:</strong>{' '}
            {clientEnv.SUPPORT_EMAIL.replace('mailto:', '')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t('responseTime')}</p>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
