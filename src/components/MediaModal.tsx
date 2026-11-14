import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaName?: string;
  mediaSize?: string;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  mediaName = 'Archivo multimedia',
  mediaSize,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col min-w-0 pr-3">
          <span className="text-sm font-semibold text-white truncate">{mediaName}</span>
          {mediaSize && <span className="text-xs text-[#94a3b8]">{mediaSize}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="w-9 h-9 rounded-full bg-[#1e2430] flex items-center justify-center text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="w-9 h-9 rounded-full bg-[#1e2430] flex items-center justify-center text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={mediaUrl}
            download={mediaName}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-[#1e2430] flex items-center justify-center text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Cerrar visor"
            className="w-9 h-9 rounded-full bg-[#2b3242] flex items-center justify-center text-white hover:bg-[#363e52] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={mediaName}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[82vh] max-w-full object-contain rounded-lg transition-transform duration-200"
          />
        ) : (
          <video
            key={mediaUrl}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            preload="auto"
            className="max-h-[82vh] max-w-full rounded-lg bg-black"
          />
        )}
      </div>
    </div>
  );
};
