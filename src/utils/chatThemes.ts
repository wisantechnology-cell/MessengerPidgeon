import { ChatPersonalityTheme, EmotionalMode } from '../types';

export const CHAT_PERSONALITY_THEMES: ChatPersonalityTheme[] = [
  {
    id: 'default',
    name: 'Azul Clásico PidgeX',
    headerGradient: 'from-[#0084ff] to-[#00a6e0]',
    bubbleMeBg: '#0284c7',
    bubbleMeText: '#ffffff',
    bubbleThemBg: '#1c2331',
    bubbleThemText: '#eef2f8',
    accentColor: '#38bdf8',
    sendEffect: 'none',
    soundPack: 'default',
    animatedBg: 'none',
  },
  {
    id: 'futuristic',
    name: 'Futurista Orbital',
    headerGradient: 'from-cyan-600 via-blue-700 to-indigo-900',
    bubbleMeBg: '#0891b2',
    bubbleMeText: '#ffffff',
    bubbleThemBg: '#131d33',
    bubbleThemText: '#cffafe',
    accentColor: '#22d3ee',
    sendEffect: 'sparks',
    soundPack: 'cyber',
    animatedBg: 'stars',
  },
  {
    id: 'romantic',
    name: 'Romántico Estelar',
    headerGradient: 'from-rose-600 via-pink-600 to-fuchsia-700',
    bubbleMeBg: '#e11d48',
    bubbleMeText: '#ffffff',
    bubbleThemBg: '#2b1526',
    bubbleThemText: '#ffe4e6',
    accentColor: '#fb7185',
    sendEffect: 'hearts',
    soundPack: 'soft',
    animatedBg: 'particles',
  },
  {
    id: 'dark_cyber',
    name: 'Oscuro Grafito',
    headerGradient: 'from-slate-900 via-zinc-800 to-slate-950',
    bubbleMeBg: '#334155',
    bubbleMeText: '#f8fafc',
    bubbleThemBg: '#111827',
    bubbleThemText: '#e2e8f0',
    accentColor: '#94a3b8',
    sendEffect: 'none',
    soundPack: 'retro',
    animatedBg: 'none',
  },
  {
    id: 'minimalist',
    name: 'Minimalista Nórdico',
    headerGradient: 'from-teal-700 via-emerald-700 to-teal-800',
    bubbleMeBg: '#0f766e',
    bubbleMeText: '#ffffff',
    bubbleThemBg: '#1e293b',
    bubbleThemText: '#f1f5f9',
    accentColor: '#2dd4bf',
    sendEffect: 'bubbles',
    soundPack: 'soft',
    animatedBg: 'none',
  },
  {
    id: 'animated_aurora',
    name: 'Aurora Animada',
    headerGradient: 'from-emerald-600 via-cyan-600 to-blue-700',
    bubbleMeBg: '#0284c7',
    bubbleMeText: '#ffffff',
    bubbleThemBg: '#112233',
    bubbleThemText: '#e0f2fe',
    accentColor: '#34d399',
    sendEffect: 'confetti',
    soundPack: 'cyber',
    animatedBg: 'aurora',
  },
];

export interface EmotionalModeSpec {
  id: EmotionalMode;
  label: string;
  description: string;
  accentHex: string;
  backdropClass: string;
  reactions: { emoji: string; label: string }[];
}

export const EMOTIONAL_MODES: EmotionalModeSpec[] = [
  {
    id: 'neutral',
    label: 'Estándar',
    description: 'Ambiente limpio y equilibrado',
    accentHex: '#38bdf8',
    backdropClass: '',
    reactions: [
      { emoji: '❤️', label: 'Me encanta' },
      { emoji: '👍', label: 'Me gusta' },
      { emoji: '🔥', label: 'Fuego' },
      { emoji: '🙌', label: 'Aplausos' },
      { emoji: '🎉', label: 'Fiesta' },
    ],
  },
  {
    id: 'romantico',
    label: 'Romántico',
    description: 'Destellos cálidos y reacciones de cariño',
    accentHex: '#fb7185',
    backdropClass: 'from-rose-500/15 via-pink-500/10 to-transparent',
    reactions: [
      { emoji: '💘', label: 'Flechazo' },
      { emoji: '🥰', label: 'Ternura' },
      { emoji: '🌹', label: 'Rosa' },
      { emoji: '✨', label: 'Magia' },
      { emoji: '🤗', label: 'Abrazo' },
    ],
  },
  {
    id: 'divertido',
    label: 'Divertido',
    description: 'Confeti vibrante y risas animadas',
    accentHex: '#f59e0b',
    backdropClass: 'from-amber-500/15 via-orange-500/10 to-transparent',
    reactions: [
      { emoji: '🤣', label: 'Carcajada' },
      { emoji: '🥳', label: 'Celebrar' },
      { emoji: '🤯', label: 'Épico' },
      { emoji: '🚀', label: 'Despegue' },
      { emoji: '😂', label: 'Risa' },
    ],
  },
  {
    id: 'misterioso',
    label: 'Misterioso',
    description: 'Niebla nocturna y tonos profundos',
    accentHex: '#a78bfa',
    backdropClass: 'from-indigo-900/25 via-slate-900/15 to-transparent',
    reactions: [
      { emoji: '🔮', label: 'Oráculo' },
      { emoji: '👀', label: 'Intriga' },
      { emoji: '🕶️', label: 'Secreto' },
      { emoji: '🌙', label: 'Noche' },
      { emoji: '⚡', label: 'Impacto' },
    ],
  },
  {
    id: 'relajante',
    label: 'Relajante',
    description: 'Burbujas serenas y atmósfera zen',
    accentHex: '#34d399',
    backdropClass: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    reactions: [
      { emoji: '🫧', label: 'Calma' },
      { emoji: '🌿', label: 'Paz' },
      { emoji: '☕', label: 'Chill' },
      { emoji: '🌊', label: 'Flujo' },
      { emoji: '✨', label: 'Brillo' },
    ],
  },
  {
    id: 'futurista',
    label: 'Futurista',
    description: 'Partículas holográficas y pulso digital',
    accentHex: '#22d3ee',
    backdropClass: 'from-cyan-500/15 via-blue-600/10 to-transparent',
    reactions: [
      { emoji: '⚡', label: 'Pulso' },
      { emoji: '🛸', label: 'Futuro' },
      { emoji: '💎', label: 'Top' },
      { emoji: '🚀', label: 'Turbo' },
      { emoji: '🤖', label: 'Tech' },
    ],
  },
];

export function playThemeSoundEffect(
  soundPack: ChatPersonalityTheme['soundPack'] = 'default',
  kind: 'send' | 'receive' = 'send'
) {
  if (soundPack === 'mute' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (soundPack === 'cyber') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(kind === 'send' ? 520 : 780, now);
      osc.frequency.exponentialRampToValueAtTime(kind === 'send' ? 1120 : 540, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else if (soundPack === 'soft') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kind === 'send' ? 440 : 587, now);
      osc.frequency.exponentialRampToValueAtTime(kind === 'send' ? 660 : 494, now + 0.18);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (soundPack === 'retro') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(kind === 'send' ? 480 : 640, now);
      osc.frequency.setValueAtTime(kind === 'send' ? 720 : 880, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kind === 'send' ? 580 : 720, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }

    osc.start(now);
    osc.stop(now + 0.22);
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {
    // ignore audio policy block
  }
}
