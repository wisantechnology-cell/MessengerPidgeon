import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationMessageViewProps {
  locationData: { lat: number; lng: number; address: string };
  isSender: boolean;
  isNightMode?: boolean;
}

export const LocationMessageView: React.FC<LocationMessageViewProps> = ({
  locationData,
  isSender,
  isNightMode = false,
}) => {
  const mapUrl = `https://maps.google.com/?q=${locationData.lat},${locationData.lng}`;

  return (
    <div className="flex flex-col gap-2.5 min-w-[240px] max-w-[280px]">
      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-[#121620] flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg ring-2 ring-red-500/30">
            <MapPin className="w-4 h-4 fill-white" />
          </div>
          <span className="text-[10px] font-mono text-gray-300">Ubicación GPS</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold leading-tight">{locationData.address}</span>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-sky-300 hover:text-white flex items-center gap-1 font-semibold underline mt-0.5"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Abrir en Google Maps</span>
        </a>
      </div>
    </div>
  );
};
