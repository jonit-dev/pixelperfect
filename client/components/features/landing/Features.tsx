import React from 'react';
import {
  Type,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Lock,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Type,
    name: 'Text Preservation',
    description:
      'Proprietary text detection ensures logos and fonts remain sharp and readable, unlike traditional GANs.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    name: 'Lightning Fast',
    description: 'Optimized processing engine enhances images quickly with advanced AI technology.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: ShieldCheck,
    name: 'Ethical AI',
    description:
      'Zero-retention policy for enterprise security. We restore faithfully without altering identity or content.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: ImageIcon,
    name: 'Batch Processing',
    description:
      'Upload multiple images at once. Paid plans support 10-500 images per batch with smart queuing for bulk processing.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-surface relative overflow-hidden">
      {/* Decorative bg blob */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-full bg-base -z-10 skew-x-12 opacity-50"></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-bold uppercase tracking-wide text-accent">Feature Rich</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Everything you need for professional results
          </p>
          <p className="mt-6 text-lg text-text-secondary leading-8">
            We combine state-of-the-art generative AI with traditional computer vision to deliver
            the best of both worlds: creativity and fidelity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => (
            <div
              key={feature.name}
              className="group relative p-8 glass-card rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animated-border"
            >
              <div
                className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-6 bg-surface ${feature.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon size={24} strokeWidth={2.5} />
              </div>

              <h3 className="text-lg font-bold text-text mb-3 group-hover:text-accent transition-colors">
                {feature.name}
              </h3>

              <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Secondary Feature Strip */}
        <div className="mt-20 border-t border-border pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-surface rounded-full text-text-secondary">
                <Sparkles size={16} />
              </div>
              <span className="font-semibold text-text">Face Enhancement</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-surface rounded-full text-text-secondary">
                <Lock size={16} />
              </div>
              <span className="font-semibold text-text">Secure Processing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-surface rounded-full text-text-secondary">
                <Cpu size={16} />
              </div>
              <span className="font-semibold text-text">Fast Processing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-surface rounded-full text-text-secondary">
                <CheckCircle2 size={16} />
              </div>
              <span className="font-semibold text-text">High Availability</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line import/no-default-export
export default Features;
