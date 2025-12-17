import React from 'react';
import { ToggleButtonGroup, IToggleOption } from '@client/components/ui/ToggleButtonGroup';

export interface IUpscaleFactorSelectorProps {
  scale: 2 | 4 | 8;
  onChange: (scale: 2 | 4 | 8) => void;
  disabled?: boolean;
}

export const UpscaleFactorSelector: React.FC<IUpscaleFactorSelectorProps> = ({
  scale,
  onChange,
  disabled,
}) => {
  const SCALE_OPTIONS: IToggleOption<string>[] = [
    { value: '2', label: '2x' },
    { value: '4', label: '4x' },
    { value: '8', label: '8x' },
  ];

  const handleChange = (value: string) => {
    const scaleValue = parseInt(value, 10) as 2 | 4 | 8;
    onChange(scaleValue);
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-3 block">Upscale Factor</label>
      <ToggleButtonGroup
        options={SCALE_OPTIONS}
        value={scale.toString()}
        onChange={handleChange}
        disabled={disabled}
        columns={3}
      />
    </div>
  );
};
