import React from 'react';
import { Cpu, ChevronDown, Monitor, Image, FileImage, Sparkles, Lock } from 'lucide-react';
import {
  ModelId,
  DEFAULT_NANO_BANANA_PRO_CONFIG,
  NanoBananaProAspectRatio,
  NanoBananaProResolution,
  NanoBananaProOutputFormat,
} from '@shared/types/pixelperfect';

export interface IModelSelectorProps {
  selectedModel: 'auto' | ModelId;
  nanoBananaProConfig: typeof DEFAULT_NANO_BANANA_PRO_CONFIG;
  allowExpensiveModels?: boolean;
  onModelChange: (model: 'auto' | ModelId) => void;
  onNanoBananaProConfigChange: (config: typeof DEFAULT_NANO_BANANA_PRO_CONFIG) => void;
  onAllowExpensiveModelsChange?: (allow: boolean) => void;
  disabled?: boolean;
  isFreeUser?: boolean;
}

export const ModelSelector: React.FC<IModelSelectorProps> = ({
  selectedModel,
  nanoBananaProConfig,
  allowExpensiveModels = false,
  onModelChange,
  onNanoBananaProConfigChange,
  onAllowExpensiveModelsChange,
  disabled,
  isFreeUser = false,
}) => {
  // Model options with use-case focused labels
  const ALL_MODEL_OPTIONS: Array<{
    id: 'auto' | ModelId;
    name: string;
    credits: number | string;
    description: string;
    requiresPaid?: boolean;
  }> = [
    {
      id: 'auto',
      name: 'Auto (Recommended)',
      credits: 'Varies',
      description: 'AI picks the best option for your image',
      requiresPaid: true,
    },
    {
      id: 'real-esrgan',
      name: 'Upscale',
      credits: 1,
      description: 'Fast, reliable upscaling for most images',
    },
    {
      id: 'gfpgan',
      name: 'Face Restore',
      credits: 2,
      description: 'Old photos & portrait enhancement',
    },
    {
      id: 'clarity-upscaler',
      name: 'Upscale Plus',
      credits: 4,
      description: 'Higher quality upscaling',
    },
    {
      id: 'nano-banana-pro',
      name: 'Upscale Ultra',
      credits: 8,
      description: 'Premium restoration, 4K output',
    },
  ];

  // Filter out Auto mode for free users
  const MODEL_OPTIONS = isFreeUser
    ? ALL_MODEL_OPTIONS.filter(option => !option.requiresPaid)
    : ALL_MODEL_OPTIONS;

  const handleConfigChange = (updates: Partial<typeof DEFAULT_NANO_BANANA_PRO_CONFIG>) => {
    onNanoBananaProConfigChange({
      ...nanoBananaProConfig,
      ...updates,
    });
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-2">
        <Cpu size={14} /> AI Model
      </label>

      <div className="relative">
        <select
          value={selectedModel}
          onChange={e => onModelChange(e.target.value as 'auto' | ModelId)}
          disabled={disabled}
          className="w-full appearance-none p-3 pr-10 rounded-lg border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {MODEL_OPTIONS.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}{' '}
              {typeof model.credits === 'number'
                ? `· ${model.credits} credit${model.credits === 1 ? '' : 's'}`
                : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {selectedModel !== 'auto' && (
        <p className="text-xs text-slate-500 mt-2">
          {MODEL_OPTIONS.find(m => m.id === selectedModel)?.description}
        </p>
      )}

      {/* Auto mode: Allow expensive models checkbox */}
      {selectedModel === 'auto' && !isFreeUser && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={allowExpensiveModels}
            onChange={e => onAllowExpensiveModelsChange?.(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-slate-600 group-hover:text-slate-800">
            Allow premium models (8+ credits)
          </span>
        </label>
      )}

      {/* Free tier upgrade prompt for Auto mode */}
      {isFreeUser && (
        <div className="mt-3 p-3 border border-amber-200 rounded-lg bg-amber-50/50 flex items-start gap-2">
          <Lock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-amber-900 mb-1">Auto Mode Requires Upgrade</p>
            <p className="text-amber-700">
              Upgrade to a paid plan to unlock AI-powered automatic model selection for your images.
            </p>
          </div>
        </div>
      )}

      {/* Nano Banana Pro (Upscale Ultra) Configuration */}
      {selectedModel === 'nano-banana-pro' && (
        <div className="mt-4 p-3 border border-indigo-200 rounded-lg bg-indigo-50/50 space-y-4 animate-fade-in">
          <p className="text-xs font-medium text-indigo-700 flex items-center gap-1.5">
            <Sparkles size={12} /> Ultra Settings
          </p>

          {/* Resolution */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block flex items-center gap-1.5">
              <Monitor size={12} /> Output Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as NanoBananaProResolution[]).map(res => (
                <button
                  key={res}
                  onClick={() => handleConfigChange({ resolution: res })}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded border text-xs font-medium transition-all ${
                    nanoBananaProConfig.resolution === res
                      ? 'border-indigo-600 bg-indigo-100 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block flex items-center gap-1.5">
              <Image size={12} /> Aspect Ratio
            </label>
            <div className="relative">
              <select
                value={nanoBananaProConfig.aspectRatio}
                onChange={e =>
                  handleConfigChange({ aspectRatio: e.target.value as NanoBananaProAspectRatio })
                }
                disabled={disabled}
                className="w-full appearance-none p-2 pr-8 rounded border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="match_input_image">Match Input</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="3:4">3:4 (Portrait)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="9:16">9:16 (Vertical)</option>
                <option value="3:2">3:2 (Photo)</option>
                <option value="2:3">2:3 (Portrait Photo)</option>
                <option value="21:9">21:9 (Ultrawide)</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Output Format */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block flex items-center gap-1.5">
              <FileImage size={12} /> Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['png', 'jpg'] as NanoBananaProOutputFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handleConfigChange({ outputFormat: fmt })}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded border text-xs font-medium transition-all ${
                    nanoBananaProConfig.outputFormat === fmt
                      ? 'border-indigo-600 bg-indigo-100 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
