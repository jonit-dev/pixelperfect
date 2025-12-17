import React, { useState, useEffect } from 'react';
import { Dropzone } from '@client/components/features/image-processing/Dropzone';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { useBatchQueue } from '@client/hooks/pixelperfect/useBatchQueue';
import { IUpscaleConfig } from '@shared/types/pixelperfect';
import { StudioLayout } from './studio/StudioLayout';
import { UpgradeSuccessBanner } from './UpgradeSuccessBanner';
import { useUserData } from '@client/store/userStore';
import { DEFAULT_ENHANCEMENT_SETTINGS } from '@shared/types/pixelperfect';

export const StudioWorkspace: React.FC = () => {
  // Hook managing all queue state
  const {
    queue,
    activeId,
    activeItem,
    isProcessingBatch,
    completedCount,
    setActiveId,
    addFiles,
    removeItem,
    clearQueue,
    processBatch,
  } = useBatchQueue();

  const { subscription } = useUserData();
  const hasSubscription = !!subscription?.price_id;

  // Config State
  const [config, setConfig] = useState<IUpscaleConfig>({
    mode: 'both',
    scale: 2,
    enhanceFace: true,
    preserveText: false,
    denoise: true,
    selectedModel: 'real-esrgan',
    enhancement: DEFAULT_ENHANCEMENT_SETTINGS,
  });

  // UI State
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Show success banner after first successful batch completion
  useEffect(() => {
    if (completedCount > 0 && !isProcessingBatch) {
      setShowSuccessBanner(true);
    }
  }, [completedCount, isProcessingBatch]);

  // Empty State - Dark Theme Studio Landing
  if (queue.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-medium mb-4">
              <Sparkles size={12} /> Pro Studio
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Enhance Images with AI
            </h1>
            <p className="text-zinc-400 text-lg">
              Drag and drop your images to start the studio workspace
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-sm shadow-2xl">
            <Dropzone
              onFilesSelected={addFiles}
              className="!bg-zinc-900/50 hover:!bg-zinc-900/80 !border-white/10 hover:!border-indigo-500/50 !h-64 transition-all duration-300"
            />
          </div>

          <div className="mt-10 flex justify-center gap-8 text-zinc-500 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> No signup required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Free 5MB limit
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> No Watermark
            </div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Layers size={16} /> Batch Supported
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <StudioLayout
        queue={queue}
        activeId={activeId}
        activeItem={activeItem}
        isProcessing={isProcessingBatch}
        completedCount={completedCount}
        config={config}
        setConfig={setConfig}
        onProcess={() => processBatch(config)}
        onClear={clearQueue}
        onSelect={setActiveId}
        onRemove={removeItem}
        onAddFiles={addFiles}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
      />

      {/* Floating Success Banner */}
      {showSuccessBanner && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-1 pr-4 flex items-center gap-4">
            <UpgradeSuccessBanner
              processedCount={completedCount}
              onDismiss={() => setShowSuccessBanner(false)}
              hasSubscription={hasSubscription}
            />
          </div>
        </div>
      )}
    </div>
  );
};
