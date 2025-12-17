import React from 'react';
import { IBatchItem, ProcessingStatus } from '@shared/types/pixelperfect';
import { Dropzone } from '@client/components/features/image-processing/Dropzone';
import { Plus, X, Loader2 } from 'lucide-react';

interface IDockProps {
  queue: IBatchItem[];
  activeId: string | null;
  isProcessing: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: File[]) => void;
}

export const Dock: React.FC<IDockProps> = ({
  queue,
  activeId,
  isProcessing,
  onSelect,
  onRemove,
  onAddFiles,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[90vw]">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex gap-4 items-center shadow-2xl overflow-x-auto custom-scrollbar">
        {/* Add Button */}
        <div className="group relative shrink-0 w-16 h-16 transition-all hover:-translate-y-2 hover:scale-110 duration-200">
          <Dropzone
            onFilesSelected={onAddFiles}
            disabled={isProcessing}
            className="w-full h-full !p-0 !border-0 !bg-white/10 hover:!bg-white/20 !rounded-xl overflow-hidden shadow-lg backdrop-blur-sm transition-colors"
          >
            <div className="flex flex-col items-center justify-center h-full w-full text-white">
              <Plus size={24} />
            </div>
          </Dropzone>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-2 py-0.5 rounded-full">
            Add Images
          </div>
        </div>

        {/* Vertical Divider */}
        {queue.length > 0 && <div className="w-px h-10 bg-white/20"></div>}

        {/* Queue Items */}
        {queue.map(item => (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
                group relative w-16 h-16 shrink-0 rounded-xl cursor-pointer transition-all duration-200 ease-out
                hover:-translate-y-2 hover:scale-110
                ${activeId === item.id ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' : 'hover:ring-1 hover:ring-white/50'}
            `}
          >
            <img
              src={item.previewUrl}
              alt="Thumbnail"
              className="w-full h-full object-cover rounded-xl bg-black/20"
              loading="lazy"
            />

            {/* Remove Button */}
            {!isProcessing && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
              >
                <X size={10} />
              </button>
            )}

            {/* Status Indicator (Bottom Dot) */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex justify-center">
              {item.status === ProcessingStatus.COMPLETED && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              )}
              {item.status === ProcessingStatus.ERROR && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              )}
              {item.status === ProcessingStatus.PROCESSING && (
                <Loader2 size={10} className="text-indigo-400 animate-spin" />
              )}
            </div>

            {/* Hover Tooltip (Filename) */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/60 px-2 py-0.5 rounded-full backdrop-blur pointer-events-none max-w-[120px] truncate">
              {item.file.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
