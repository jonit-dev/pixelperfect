'use client';

import React, { useState, useEffect } from 'react';
import { Dropzone } from '@client/components/features/image-processing/Dropzone';
import { CheckCircle2, Layers } from 'lucide-react';
import { useBatchQueue } from '@client/hooks/pixelperfect/useBatchQueue';
import { IUpscaleConfig, IBatchItem } from '@shared/types/pixelperfect';
import { BatchSidebar } from '@client/components/features/workspace/BatchSidebar';
import { PreviewArea } from '@client/components/features/workspace/PreviewArea';
import { QueueStrip } from '@client/components/features/workspace/QueueStrip';
import { downloadSingle } from '@client/utils/download';
import { UpgradeSuccessBanner } from './UpgradeSuccessBanner';
import { useUserData } from '@client/store/userStore';
import { DEFAULT_ENHANCEMENT_SETTINGS } from '@shared/types/pixelperfect';

const Workspace: React.FC = () => {
  // Hook managing all queue state
  const {
    queue,
    activeId,
    activeItem,
    isProcessingBatch,
    batchProgress,
    completedCount,
    setActiveId,
    addFiles,
    removeItem,
    clearQueue,
    processBatch,
    processSingleItem,
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

  // Success banner state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Show success banner after first successful batch completion
  useEffect(() => {
    if (completedCount > 0 && !isProcessingBatch) {
      setShowSuccessBanner(true);
    }
  }, [completedCount, isProcessingBatch]);

  // Handlers
  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      setDownloadError(null);
      await downloadSingle(url, filename, config.mode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to download image';
      setDownloadError(errorMessage);
      console.error('Download error:', error);
    }
  };

  // Empty State
  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-8 sm:p-16 flex-grow flex flex-col justify-center">
          <Dropzone onFilesSelected={addFiles} />
          <div className="mt-8 flex justify-center gap-8 text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> No signup required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Free 5MB limit
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> No Watermark
            </div>
            <div className="flex items-center gap-2 text-indigo-500">
              <Layers size={16} /> Batch Supported
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Workspace State
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
      <div className="flex flex-col md:flex-row flex-grow h-full">
        {/* Left Sidebar */}
        <BatchSidebar
          config={config}
          setConfig={setConfig}
          queue={queue}
          isProcessing={isProcessingBatch}
          batchProgress={batchProgress}
          completedCount={completedCount}
          onProcess={() => processBatch(config)}
          onClear={clearQueue}
        />

        {/* Right Area: Main View + Queue Strip */}
        <div className="flex-grow flex flex-col bg-slate-50 overflow-hidden relative">
          {/* Success Banner */}
          {showSuccessBanner && (
            <div className="p-4">
              <UpgradeSuccessBanner
                processedCount={completedCount}
                onDismiss={() => setShowSuccessBanner(false)}
                hasSubscription={hasSubscription}
              />
            </div>
          )}

          {/* Download Error Notification */}
          {downloadError && (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-bold">
                  !
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">Download Failed</h4>
                  <p className="text-sm text-red-700">{downloadError}</p>
                </div>
                <button
                  onClick={() => setDownloadError(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  aria-label="Dismiss error"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Main Preview Area */}
          <div className="flex-grow p-6 flex items-center justify-center overflow-hidden relative">
            <PreviewArea
              activeItem={activeItem}
              onDownload={handleDownloadSingle}
              onRetry={(item: IBatchItem) => processSingleItem(item, config)}
              selectedModel={config.selectedModel}
              batchProgress={batchProgress}
            />
          </div>

          {/* Bottom Queue Strip */}
          <QueueStrip
            queue={queue}
            activeId={activeId}
            isProcessing={isProcessingBatch}
            onSelect={setActiveId}
            onRemove={removeItem}
            onAddFiles={addFiles}
          />
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default Workspace;
