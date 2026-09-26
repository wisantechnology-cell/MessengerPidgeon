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
  mediaSize = '3.8 MB',
}) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e16]/95 backdrop-blur-2xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#dfe2ee]">{mediaName}</span>
          <span className="text-xs text-[#8d90a0]">{mediaSize} • MessengerPidgeon Secure</span>
        </div>
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="w-9 h-9 rounded-full bg-[#1c2028] flex items-center justify-center text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="w-9 h-9 rounded-full bg-[#1c2028] flex items-center justify-center text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-[#1c2028] flex items-center justify-center text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
            title="Abrir enlace original"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Cerrar visor"
            className="w-9 h-9 rounded-full bg-[#262a33] flex items-center justify-center text-[#dfe2ee] hover:bg-[#31353e] transition-colors cursor-pointer"
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
            className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[82vh] max-w-full rounded-xl shadow-2xl"
          />
        )}
      </div>
    </div>
  );
};
