import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  durationText?: string;
  isSender?: boolean;
  audioUrl?: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  durationText = '0:15',
  isSender = false,
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [realCurrentTime, setRealCurrentTime] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse duration in seconds (e.g., "0:24" -> 24)
  const totalSeconds = (() => {
    const parts = durationText.split(':');
    if (parts.length === 2) {
      const parsed = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      return isNaN(parsed) || parsed <= 0 ? 15 : parsed;
    }
    return 15;
  })();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Setup real HTMLAudioElement if audioUrl is provided
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(Math.min(100, pct));
        setRealCurrentTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setRealCurrentTime(0);
    };

    audio.onerror = () => {
      console.warn('Audio play error, falling back to simulated');
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Handle Play/Pause and fallback timer if audioUrl is not available or fails
  useEffect(() => {
    if (!audioUrl) {
      if (isPlaying) {
        intervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              setIsPlaying(false);
              return 0;
            }
            return prev + (100 / (totalSeconds * 10)) * playbackRate;
          });
        }, 100);
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPlaying, playbackRate, totalSeconds, audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (progress >= 100) {
          audioRef.current.currentTime = 0;
          setProgress(0);
        }
        audioRef.current.playbackRate = playbackRate;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback caught:', err);
            // Fallback to simulated playback
            setIsPlaying(true);
          });
      }
    } else {
      if (progress >= 100) setProgress(0);
      setIsPlaying(!isPlaying);
    }
  };

  const toggleRate = () => {
    let newRate = 1;
    if (playbackRate === 1) newRate = 1.5;
    else if (playbackRate === 1.5) newRate = 2;
    else newRate = 1;

    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleSeek = (newPct: number) => {
    setProgress(newPct);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newPct / 100) * audioRef.current.duration;
      setRealCurrentTime(audioRef.current.currentTime);
    }
  };

  // Waveform bars
  const barHeights = [25, 45, 80, 50, 95, 30, 70, 85, 40, 60, 90, 35, 75, 55, 90, 65, 40, 20];

  const displayTime = audioUrl
    ? isPlaying || progress > 0
      ? formatTime(realCurrentTime)
      : durationText
    : isPlaying
    ? formatTime(Math.floor((progress / 100) * totalSeconds))
    : durationText;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[220px]">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer ${
          isSender
            ? 'bg-white text-[#0284c7] hover:bg-sky-50'
            : 'bg-[#0284c7] text-white hover:bg-[#0369a1]'
        }`}
        title={isPlaying ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform track */}
      <div className="flex-1 flex flex-col gap-1">
        <div
          className="flex items-center gap-0.5 h-6 cursor-pointer py-1 select-none"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            handleSeek(newPct);
          }}
        >
          {barHeights.map((h, i) => {
            const barPct = (i / barHeights.length) * 100;
            const isFilled = progress >= barPct;
            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: isFilled
                    ? isSender
                      ? '#ffffff'
                      : '#38bdf8'
                    : isSender
                    ? 'rgba(255, 255, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            );
          })}
        </div>

        {/* Time display & playback speed */}
        <div className="flex items-center justify-between text-[11px] leading-none opacity-90">
          <span className={isSender ? 'text-white/90 font-mono text-[10px]' : 'text-[#8d90a0] font-mono text-[10px]'}>
            {displayTime}
          </span>
          <button
            type="button"
            onClick={toggleRate}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              isSender
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-sky-200 hover:text-white hover:bg-white/20'
            }`}
            title="Cambiar velocidad de reproducción"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
