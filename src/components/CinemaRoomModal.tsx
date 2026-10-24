import React, { useState } from 'react';
import { X, Play, Film, MessageCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface CinemaRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isNightMode?: boolean;
  onShareVideo: (videoTitle: string, videoUrl: string) => void;
}

const CINEMA_CLIPS = [
  {
    id: 'lofi',
    title: 'Lofi Chill & Study Beats 🎧',
    duration: '2:45 min',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
  },
  {
    id: 'nature',
    title: 'Paisajes del Ártico y Auroras 🌌',
    duration: '3:20 min',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCueVKWYMF5gc-0zbHBX4DEErFXwEYKKm2WqjNKK0poZlIm5KzMaSCoPUwfUQsQSegKM5iHJgzqZa85DDXqYEKsof3HxO60of4j6ZKKshWj-xFGm6aw3MigExbLNix_HAk1ftZOmLAexAw2qLt2C9AQqxdvDjEdHERAHQOysD2fs2lihiJFmrWg5pFd_Gxceor--mlVtt1dCYSiJ3XX0bo2nCrJyGspLATRA6_u2Yh0D4je5e4kLrMi',
    videoUrl: 'https://www.youtube.com/watch?v=1XLaZB1drrc',
  },
  {
    id: 'synth',
    title: 'Cyberpunk Synthwave Neon Ride 🌆',
    duration: '4:10 min',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVnlBFYvn25H3Hv6FvrPSYERS0uva9javhpl8gBvhIhe4kEmMKgHLgzvoFgf5ge2eXDPw508qBPry3NsCpQdxwZl-LwZW4zHJ-gb3clDt0-EObLDshMlREnnM6FcfN3ZN3JPE-7yYXUIuwHGgIOhHZ18NXiQabpPhn06jGEy3LJXGf2HISwQblqfq6opeQV8dNm1L_HoznQ8XaRFz0MAIoQ-DhEZCykeayocboesHcHWvOIi_o28Bu',
    videoUrl: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
  },
];

export const CinemaRoomModal: React.FC<CinemaRoomModalProps> = ({
  isOpen,
  onClose,
  user,
  isNightMode = false,
  onShareVideo,
}) => {
  if (!isOpen) return null;

  const [activeClip, setActiveClip] = useState(CINEMA_CLIPS[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-xl w-full rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isNightMode ? 'bg-[#181c24] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Sala de Cine / Proyector Grupal</h3>
              <span className="text-xs text-[#8d90a0]">Comparte y proyecta clips en vivo con tus amigos</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Preview */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/20 flex items-center justify-center group">
          <img src={activeClip.thumbnail} alt={activeClip.title} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] uppercase">
                En Proyección 🔴
              </span>
              <span className="text-xs text-gray-300">{activeClip.duration}</span>
            </div>
            <h4 className="text-lg font-black text-white">{activeClip.title}</h4>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl scale-95 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Clips Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#8d90a0]">Seleccionar Clip para Proyectar:</span>
          <div className="grid grid-cols-3 gap-2.5">
            {CINEMA_CLIPS.map((clip) => (
              <button
                key={clip.id}
                onClick={() => setActiveClip(clip)}
                className={`flex flex-col text-left rounded-2xl overflow-hidden border-2 p-1.5 transition-all cursor-pointer ${
                  activeClip.id === clip.id ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-black/20 hover:border-white/30'
                }`}
              >
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-1.5">
                  <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold truncate">{clip.title}</span>
                <span className="text-[10px] text-[#8d90a0]">{clip.duration}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            onShareVideo(activeClip.title, activeClip.videoUrl);
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
        >
          <Sparkles className="w-4 h-4" />
          <span>Compartir Proyección en el Chat</span>
        </button>
      </div>
    </div>
  );
};
