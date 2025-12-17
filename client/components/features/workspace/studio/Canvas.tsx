import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { IBatchItem, ProcessingStatus } from '@shared/types/pixelperfect';
import { Loader2, AlertTriangle, Layers, MousePointer2 } from 'lucide-react';

interface ICanvasProps {
  activeItem: IBatchItem | null;
}

export const Canvas: React.FC<ICanvasProps> = ({ activeItem }) => {
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!activeItem) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-zinc-950">
        <div className="text-center">
          <Layers size={64} className="mx-auto mb-6 opacity-20 text-white" />
          <p className="text-zinc-500 font-medium">Select or upload an image to start</p>
        </div>
      </div>
    );
  }

  const isCompleted = activeItem.status === ProcessingStatus.COMPLETED && activeItem.processedUrl;
  const isProcessing = activeItem.status === ProcessingStatus.PROCESSING;
  const isError = activeItem.status === ProcessingStatus.ERROR;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !isCompleted) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLensPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="w-full h-full bg-zinc-950 relative overflow-hidden flex items-center justify-center">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <div
            ref={containerRef}
            className="relative shadow-2xl shadow-black/50"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Base Image (Original or Preview) */}
            <img
              src={activeItem.previewUrl}
              alt="Original"
              className="max-w-[85vw] max-h-[85vh] object-contain block"
              draggable={false}
            />

            {/* Magic Lens Layer (Processed) */}
            {isCompleted && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: isHovering
                    ? `circle(150px at ${lensPos.x}px ${lensPos.y}px)`
                    : 'circle(0% at 0 0)',
                  transition: 'clip-path 0.1s ease-out',
                }}
              >
                <img
                  src={activeItem.processedUrl!}
                  alt="Processed"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                {/* Lens Border/Indicator */}
                {isHovering && (
                  <div
                    className="absolute w-[300px] h-[300px] rounded-full border-2 border-white/50 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: lensPos.x,
                      top: lensPos.y,
                    }}
                  />
                )}
              </div>
            )}

            {/* Hint Overlay when completed */}
            {isCompleted && !isHovering && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <MousePointer2 size={12} />
                Hover to compare
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                <div className="bg-zinc-900/90 p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col items-center">
                  <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                  <p className="text-white font-medium mb-1">Processing...</p>
                  <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${activeItem.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {activeItem.stage} - {activeItem.progress}%
                  </p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {isError && (
              <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-red-900/50 flex flex-col items-center text-center max-w-sm">
                  <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-3">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-white font-medium mb-1">Processing Failed</h3>
                  <p className="text-zinc-400 text-sm">{activeItem.error}</p>
                </div>
              </div>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
