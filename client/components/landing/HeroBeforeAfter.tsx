'use client';

import React from 'react';
import { BeforeAfterSlider } from '../ui/BeforeAfterSlider';

export const HeroBeforeAfter: React.FC = () => {
  return (
    <div className="glass-card p-2 animated-border rounded-2xl">
      <BeforeAfterSlider
        beforeUrl="/before-after/women-before.png"
        afterUrl="/before-after/women-after.png"
        beforeLabel="Original"
        afterLabel="Enhanced"
        className="aspect-[16/10] rounded-xl"
      />
    </div>
  );
};
