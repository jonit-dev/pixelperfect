import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  IUpscaleConfig,
  IBatchItem,
  ProcessingStatus,
  ModelId,
  IEnhancementSettings,
  DEFAULT_ENHANCEMENT_SETTINGS,
  DEFAULT_NANO_BANANA_PRO_CONFIG,
} from '@shared/types/pixelperfect';
import { downloadBatch } from '@client/utils/download';
import { useUserData } from '@client/store/userStore';
import { getCreditCostForMode, calculateModelCreditCost } from '@shared/config/subscription.utils';
import { generatePrompt } from '@client/utils/prompt-utils';
import {
  ModeSelector,
  EnhancementPanel,
  ModelSelector,
  UpscaleFactorSelector,
  FeatureToggles,
  ActionPanel,
} from '../BatchSidebar/index';

interface IControlPanelProps {
  config: IUpscaleConfig;
  setConfig: (config: IUpscaleConfig) => void;
  queue: IBatchItem[];
  isProcessing: boolean;
  completedCount: number;
  onProcess: () => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ControlPanel: React.FC<IControlPanelProps> = ({
  config,
  setConfig,
  queue,
  isProcessing,
  completedCount,
  onProcess,
  onClear,
  isOpen,
  onToggle,
}) => {
  const router = useRouter();
  const { totalCredits, profile } = useUserData();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  // Determine if user is on free tier
  const isFreeUser = !profile?.subscription_tier;

  const handleDownloadAll = () => {
    downloadBatch(queue, config.mode);
  };

  // Calculate credit costs
  const pendingQueue = queue.filter(i => i.status !== ProcessingStatus.COMPLETED);
  const isAutoModel = config.selectedModel === 'auto';
  const costPerImage = isAutoModel
    ? getCreditCostForMode(config.mode)
    : calculateModelCreditCost({
        mode: config.mode,
        modelId: config.selectedModel,
        scale: config.scale,
      });
  const totalCost = pendingQueue.length * costPerImage;

  // Handlers
  const handleModeChange = (mode: typeof config.mode) => setConfig({ ...config, mode });
  const handleEnhancementChange = (enhancement: IEnhancementSettings) =>
    setConfig({ ...config, enhancement });
  const handleScaleChange = (scale: 2 | 4 | 8) => setConfig({ ...config, scale });
  const handleModelChange = (selectedModel: 'auto' | ModelId) =>
    setConfig({ ...config, selectedModel });
  const handleNanoBananaProConfigChange = (
    nanoBananaProConfig: typeof DEFAULT_NANO_BANANA_PRO_CONFIG
  ) => setConfig({ ...config, nanoBananaProConfig });
  const handleAllowExpensiveModelsChange = (allowExpensiveModels: boolean) =>
    setConfig({ ...config, allowExpensiveModels });
  const handlePreserveTextChange = (preserveText: boolean) =>
    setConfig({ ...config, preserveText });
  const handleEnhanceFaceChange = (enhanceFace: boolean) => setConfig({ ...config, enhanceFace });
  const handlePromptChange = (customPrompt: string) => setConfig({ ...config, customPrompt });

  const placeholderPrompt = generatePrompt({ ...config, mode: 'both' });

  return (
    <div
      className={`
        absolute top-4 bottom-4 right-4 z-20 flex transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+16px)]'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-6 -translate-x-full bg-white/90 backdrop-blur-md p-2 rounded-l-xl border border-r-0 border-white/20 shadow-lg text-slate-600 hover:text-slate-900 transition-colors"
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Main Panel */}
      <div className="w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100/50 shrink-0 bg-white/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <Settings size={18} /> Studio Settings
          </h3>
          <p className="text-xs text-slate-500">Applies to all {queue.length} images</p>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-6 space-y-8">
          <ModeSelector mode={config.mode} onChange={handleModeChange} disabled={isProcessing} />

          {config.mode === 'enhance' && (
            <EnhancementPanel
              settings={config.enhancement || DEFAULT_ENHANCEMENT_SETTINGS}
              onChange={handleEnhancementChange}
              disabled={isProcessing}
            />
          )}

          {config.mode === 'custom' && (
            <div className="animate-fade-in">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Custom Prompt Instructions
              </label>
              <textarea
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[140px] resize-y font-mono bg-slate-50 text-slate-800"
                placeholder={placeholderPrompt}
                value={config.customPrompt || ''}
                onChange={e => handlePromptChange(e.target.value)}
              />
            </div>
          )}

          <ModelSelector
            selectedModel={config.selectedModel}
            nanoBananaProConfig={config.nanoBananaProConfig || DEFAULT_NANO_BANANA_PRO_CONFIG}
            allowExpensiveModels={config.allowExpensiveModels ?? false}
            onModelChange={handleModelChange}
            onNanoBananaProConfigChange={handleNanoBananaProConfigChange}
            onAllowExpensiveModelsChange={handleAllowExpensiveModelsChange}
            disabled={isProcessing}
            isFreeUser={isFreeUser}
          />

          {(config.mode === 'upscale' || config.mode === 'both') && (
            <UpscaleFactorSelector
              scale={config.scale}
              onChange={handleScaleChange}
              disabled={isProcessing}
            />
          )}

          <FeatureToggles
            preserveText={config.preserveText}
            enhanceFace={config.enhanceFace}
            onPreserveTextChange={handlePreserveTextChange}
            onEnhanceFaceChange={handleEnhanceFaceChange}
            disabled={isProcessing}
          />
        </div>

        {/* Sticky Action Panel Footer */}
        <div className="shrink-0 bg-white/50 border-t border-slate-100/50">
          <ActionPanel
            queue={queue}
            isProcessing={isProcessing}
            completedCount={completedCount}
            totalCost={totalCost}
            currentBalance={totalCredits}
            onProcess={onProcess}
            onDownloadAll={handleDownloadAll}
            onClear={onClear}
            showInsufficientModal={showInsufficientModal}
            setShowInsufficientModal={setShowInsufficientModal}
            router={router}
          />
        </div>
      </div>
    </div>
  );
};
