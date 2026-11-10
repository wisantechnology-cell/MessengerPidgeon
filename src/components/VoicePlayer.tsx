import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { SquirrelVoiceIcon, RobotVoiceIcon, DeepVoiceIcon } from './CustomVectorIcons';
import { createFallbackVoiceAudio } from '../utils/audioUtils';

interface VoicePlayerProps {
  durationText?: string;
  isSender?: boolean;
  audioUrl?: string;
  voiceFilter?: 'normal' | 'chipmunk' | 'robot' | 'deep';
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  durationText = '0:15',
  isSender = false,
  audioUrl,
  voiceFilter,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [realCurrentTime, setRealCurrentTime] = useState<number>(0);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse duration in seconds (e.g., "2:00" -> 120, "0:24" -> 24)
  const fallbackSeconds = (() => {
    const parts = (durationText || '').trim().split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(s)) {
        const total = m * 60 + s;
        if (total > 0) return total;
      }
    }
    return 15;
  })();

  const effectiveDuration = detectedDuration && detectedDuration > 0
    ? detectedDuration
    : fallbackSeconds;

  const formatTime = (secs: number) => {
    const clamped = Math.max(0, Math.floor(secs));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Resolve playable URL: real voice URL or small emergency synthesized sound if truly empty
  const effectiveAudioUrl = (audioUrl && audioUrl.trim().length > 10)
    ? audioUrl
    : createFallbackVoiceAudio(Math.min(fallbackSeconds, 6));

  const applyPitchAndRate = (audio: HTMLAudioElement, rate: number) => {
    let effectiveRate = rate;
    if (voiceFilter === 'chipmunk') {
      effectiveRate = rate * 1.35;
      (audio as any).preservesPitch = false;
      (audio as any).mozPreservesPitch = false;
      (audio as any).webkitPreservesPitch = false;
    } else if (voiceFilter === 'deep') {
      effectiveRate = rate * 0.8;
      (audio as any).preservesPitch = false;
      (audio as any).mozPreservesPitch = false;
      (audio as any).webkitPreservesPitch = false;
    } else if (voiceFilter === 'robot') {
      effectiveRate = rate * 1.05;
    } else {
      (audio as any).preservesPitch = true;
      (audio as any).mozPreservesPitch = true;
      (audio as any).webkitPreservesPitch = true;
    }
    audio.playbackRate = effectiveRate;
  };

  // Re-create or re-configure Audio instance when URL changes
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.src = effectiveAudioUrl;
    applyPitchAndRate(audio, playbackRate);

    const onMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDetectedDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('durationchange', onMetadata);

    audio.ontimeupdate = () => {
      const dur = (audio.duration && isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : effectiveDuration;

      const cur = audio.currentTime || 0;
      const pct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
      setProgress(pct);
      setRealCurrentTime(cur);

      // Only end when actually reaching end of audio (never on 0:00 tick!)
      if (dur > 0.5 && cur >= dur - 0.1 && cur > 0.4) {
        setIsPlaying(false);
        setProgress(0);
        setRealCurrentTime(0);
        audio.pause();
        audio.currentTime = 0;
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setRealCurrentTime(0);
    };

    audio.onerror = () => {
      console.warn('Audio decoding error for URL:', effectiveAudioUrl.slice(0, 50));
    };

    return () => {
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('durationchange', onMetadata);
      audio.pause();
      audioRef.current = null;
    };
  }, [effectiveAudioUrl, voiceFilter]);

  // Adjust rate when playbackRate state changes
  useEffect(() => {
    if (audioRef.current) {
      applyPitchAndRate(audioRef.current, playbackRate);
    }
  }, [playbackRate, voiceFilter]);

  const togglePlay = () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(effectiveAudioUrl);
      audioRef.current = audio;
      audio.preload = 'auto';
      audio.volume = 1.0;
      applyPitchAndRate(audio, playbackRate);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const dur = (audio.duration && isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : effectiveDuration;

      if (audio.currentTime >= dur || progress >= 100) {
        audio.currentTime = 0;
        setProgress(0);
        setRealCurrentTime(0);
      }
      applyPitchAndRate(audio, playbackRate);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Audio play request notice:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const toggleRate = () => {
    let newRate = 1;
    if (playbackRate === 1) newRate = 1.5;
    else if (playbackRate === 1.5) newRate = 2;
    else newRate = 1;

    setPlaybackRate(newRate);
    if (audioRef.current) {
      applyPitchAndRate(audioRef.current, newRate);
    }
  };

  const handleSeek = (newPct: number) => {
    setProgress(newPct);
    const audio = audioRef.current;
    if (audio) {
      const dur = (audio.duration && isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : effectiveDuration;
      const targetTime = (newPct / 100) * dur;
      audio.currentTime = targetTime;
      setRealCurrentTime(targetTime);
    }
  };

  // Waveform bars with dynamic heights
  const barHeights = [25, 45, 80, 50, 95, 30, 70, 85, 40, 60, 90, 35, 75, 55, 90, 65, 40, 20];

  const displayTime = isPlaying || progress > 0
    ? formatTime(realCurrentTime)
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
                  height: isPlaying ? `${Math.max(20, (h * (0.8 + 0.4 * Math.sin(realCurrentTime * 6 + i))))}%` : `${h}%`,
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
          {voiceFilter && voiceFilter !== 'normal' && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
              voiceFilter === 'chipmunk' ? 'bg-pink-500/30 text-pink-200' :
              voiceFilter === 'robot' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-purple-500/30 text-purple-200'
            }`}>
              {voiceFilter === 'chipmunk' && <><SquirrelVoiceIcon className="w-3 h-3" /> Ardilla</>}
              {voiceFilter === 'robot' && <><RobotVoiceIcon className="w-3 h-3" /> Robot</>}
              {voiceFilter === 'deep' && <><DeepVoiceIcon className="w-3 h-3" /> Grave</>}
            </span>
          )}
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
