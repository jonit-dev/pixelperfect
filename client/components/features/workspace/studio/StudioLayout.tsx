import React from 'react';
import { IBatchItem, IUpscaleConfig } from '@shared/types/pixelperfect';
import { Canvas } from './Canvas';
import { ControlPanel } from './ControlPanel';
import { Dock } from './Dock';

interface IStudioLayoutProps {
  // Queue State
  queue: IBatchItem[];
  activeId: string | null;
  activeItem: IBatchItem | null;

  // Processing State
  isProcessing: boolean;
  completedCount: number;

  // Config State
  config: IUpscaleConfig;
  setConfig: (config: IUpscaleConfig) => void;

  // Actions
  onProcess: () => void;
  onClear: () => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: File[]) => void;

  // UI State
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

export const StudioLayout: React.FC<IStudioLayoutProps> = ({
  queue,
  activeId,
  activeItem,
  isProcessing,
  completedCount,
  config,
  setConfig,
  onProcess,
  onClear,
  onSelect,
  onRemove,
  onAddFiles,
  isPanelOpen,
  onTogglePanel,
}) => {
  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-zinc-950">
      {/* Layer 1: Infinite Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas activeItem={activeItem} />
      </div>

      {/* Layer 2: Floating UI Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Dock (Bottom) - Pointer events re-enabled on child */}
        <div className="pointer-events-auto">
          <Dock
            queue={queue}
            activeId={activeId}
            isProcessing={isProcessing}
            onSelect={onSelect}
            onRemove={onRemove}
            onAddFiles={onAddFiles}
          />
        </div>

        {/* Control Panel (Right) - Pointer events re-enabled on child */}
        <div className="pointer-events-auto h-full">
          <ControlPanel
            config={config}
            setConfig={setConfig}
            queue={queue}
            isProcessing={isProcessing}
            completedCount={completedCount}
            onProcess={onProcess}
            onClear={onClear}
            isOpen={isPanelOpen}
            onToggle={onTogglePanel}
          />
        </div>
      </div>
    </div>
  );
};
