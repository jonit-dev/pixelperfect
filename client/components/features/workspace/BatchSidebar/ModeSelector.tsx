import React from 'react';
import { ArrowUpCircle, Sparkles, Layers, Edit } from 'lucide-react';
import { ToggleButtonGroup, IToggleOption } from '@client/components/ui/ToggleButtonGroup';
import { ProcessingMode } from '@shared/types/pixelperfect';

export interface IModeSelectorProps {
  mode: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<IModeSelectorProps> = ({ mode, onChange, disabled }) => {
  const MODE_OPTIONS: IToggleOption<ProcessingMode>[] = [
    { value: 'upscale', label: 'Upscale', icon: ArrowUpCircle },
    { value: 'enhance', label: 'Enhance', icon: Sparkles },
    { value: 'both', label: 'Both', icon: Layers },
    { value: 'custom', label: 'Custom', icon: Edit },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-3 block">Operation Mode</label>
      <ToggleButtonGroup
        options={MODE_OPTIONS}
        value={mode}
        onChange={onChange}
        disabled={disabled}
        columns={2}
      />
    </div>
  );
};
