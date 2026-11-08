// Sound, Ringtone, Vibration and Screen Wake Manager for PidgeX
import { UserProfile } from '../types';

export interface RingtoneOption {
  id: string;
  name: string;
  description: string;
  type: 'call' | 'message';
  icon: string;
}

export const CALL_RINGTONE_OPTIONS: RingtoneOption[] = [
  { id: 'pidgex_melody', name: 'PidgeX Melodía Acústica', description: 'Arpegio alegre y armónico característico de PidgeX', type: 'call', icon: '🕊️' },
  { id: 'tropical_bird', name: 'Pájaro Cantor Tropical', description: 'Trinos rítmicos y alegres de aves exóticas', type: 'call', icon: '🦜' },
  { id: 'digital_phone', name: 'Teléfono Electrónico Clásico', description: 'Tono dual tradicional de llamada telefónica', type: 'call', icon: '☎️' },
  { id: 'retro_synth', name: 'Synthwave 80s Retro', description: 'Acordes modernos synthwave electrónicos', type: 'call', icon: '🎹' },
  { id: 'marimba_pop', name: 'Marimba Tropical Pop', description: 'Madera percusiva con ritmo caribeño suave', type: 'call', icon: '🌴' },
  { id: 'custom', name: 'Audio de tu Galería / Archivo', description: 'Tu propia canción o audio favorito del dispositivo', type: 'call', icon: '📁' },
];

export const MESSAGE_TONE_OPTIONS: RingtoneOption[] = [
  { id: 'pidgex_chirp', name: 'PidgeX Pío Pío Clásico', description: 'Doble trino de bienvenida amigable', type: 'message', icon: '🕊️' },
  { id: 'soft_chime', name: 'Campana de Cristal', description: 'Resonancia suave, elegante y limpia', type: 'message', icon: '🔔' },
  { id: 'bubble_pop', name: 'Burbuja de Agua Pop', description: 'Sonido divertido y ligero como burbuja', type: 'message', icon: '🫧' },
  { id: 'digital_pulse', name: 'Pulso Futurista', description: 'Notificación tecnológica rápida y clara', type: 'message', icon: '⚡' },
  { id: 'happy_whistle', name: 'Silbido Alegre', description: 'Silbido corto de dos notas ascendentes', type: 'message', icon: '🎶' },
  { id: 'custom', name: 'Audio de tu Galería / Archivo', description: 'Tu propio tono descargado o nota de audio', type: 'message', icon: '📁' },
];

class RingtoneAudioManager {
  private activeCallAudio: HTMLAudioElement | null = null;
  private activeMessageAudio: HTMLAudioElement | null = null;
  private previewAudio: HTMLAudioElement | null = null;
  private callRingInterval: any = null;
  private callVibrateInterval: any = null;
  private wakeLockSentinel: any = null;
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // --- VIBRATION CONTROLS ---
  startCallVibration() {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    this.stopCallVibration();

    const vibratePattern = [600, 300, 600, 300, 600, 300];
    try {
      navigator.vibrate(vibratePattern);
      this.callVibrateInterval = setInterval(() => {
        try {
          navigator.vibrate(vibratePattern);
        } catch {}
      }, 2700);
    } catch (e) {
      console.warn('Vibration not permitted or unsupported:', e);
    }
  }

  stopCallVibration() {
    if (this.callVibrateInterval) {
      clearInterval(this.callVibrateInterval);
      this.callVibrateInterval = null;
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }

  triggerMessageVibration() {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate([180, 90, 180]);
    } catch (e) {
      console.warn('Message vibration warning:', e);
    }
  }

  // --- SCREEN WAKE LOCK ("Prender celular / Pantalla") ---
  async requestScreenWakeLock() {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (e) {
      // Screen Wake Lock can fail if low battery or tab in background
      console.warn('Screen WakeLock error:', e);
    }
  }

  releaseScreenWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
      }
    } catch {}
  }

  // --- SYNTHESIZED PRESETS ---
  private playSynthesizedCallTone(toneId: string = 'pidgex_melody') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (toneId) {
      case 'tropical_bird': {
        // Multi-frequency bird trill
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.12;
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(2600 + (i % 2 === 0 ? 800 : -300), t);
          osc.frequency.exponentialRampToValueAtTime(4200, t + 0.08);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        }
        break;
      }

      case 'digital_phone': {
        // Standard electronic phone ring (440Hz + 480Hz dual tone)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.setValueAtTime(0.2, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.4);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);
        break;
      }

      case 'retro_synth': {
        // 80s Synth chord progression (Am -> F -> G -> C)
        const notes = [440, 523.25, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.15;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.8);
        });
        break;
      }

      case 'marimba_pop': {
        // Warm wooden marimba notes
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.14;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }

      case 'pidgex_melody':
      default: {
        // Cheerful PidgeX chime arpeggio
        const melody = [587.33, 739.99, 880, 1174.66, 880, 1174.66];
        melody.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.16;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        });
        break;
      }
    }
  }

  playSynthesizedMessageTone(toneId: string = 'pidgex_chirp') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (toneId) {
      case 'soft_chime': {
        // Crystal bell dual resonance
        const f1 = 1318.51; // E6
        const f2 = 1975.53; // B6
        [f1, f2].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
        break;
      }

      case 'bubble_pop': {
        // Water droplet bubble pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      case 'digital_pulse': {
        // High tech electronic blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.07);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'happy_whistle': {
        // Cheerful ascending whistle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'pidgex_chirp':
      default: {
        // Classic bird chirp (pío pío)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2800, now);
        osc1.frequency.exponentialRampToValueAtTime(4200, now + 0.08);
        osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.14);

        const now2 = now + 0.16;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(3000, now2);
        osc2.frequency.exponentialRampToValueAtTime(4600, now2 + 0.09);
        osc2.frequency.exponentialRampToValueAtTime(3500, now2 + 0.15);
        gain2.gain.setValueAtTime(0.22, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.16);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.16);
        break;
      }
    }
  }

  // --- START INCOMING CALL ALERT (Ringtone + Vibration + Screen Wake Lock) ---
  startIncomingCallAlert(user: UserProfile) {
    this.stopIncomingCallAlert();

    // 1. Screen Wake Lock (keep screen awake & on)
    if (user.wakeScreenOnCall !== false) {
      this.requestScreenWakeLock();
    }

    // 2. Vibration
    if (user.vibrateOnCall !== false) {
      this.startCallVibration();
    }

    // 3. Audio Ringtone
    const isCustom = user.callRingtoneId === 'custom' && user.customCallRingtoneUrl;
    if (isCustom && user.customCallRingtoneUrl) {
      try {
        const audio = new Audio(user.customCallRingtoneUrl);
        audio.loop = true;
        audio.play().catch((err) => {
          console.warn('Custom ringtone play blocked by browser, falling back to synth:', err);
          this.playSynthesizedCallTone('pidgex_melody');
        });
        this.activeCallAudio = audio;
      } catch (err) {
        console.warn('Error playing custom audio:', err);
        this.playSynthesizedCallTone('pidgex_melody');
      }
    } else {
      const tone = user.callRingtoneId || 'pidgex_melody';
      this.playSynthesizedCallTone(tone);
      this.callRingInterval = setInterval(() => {
        this.playSynthesizedCallTone(tone);
      }, 2600);
    }
  }

  stopIncomingCallAlert() {
    this.stopCallVibration();
    this.releaseScreenWakeLock();

    if (this.callRingInterval) {
      clearInterval(this.callRingInterval);
      this.callRingInterval = null;
    }

    if (this.activeCallAudio) {
      try {
        this.activeCallAudio.pause();
        this.activeCallAudio.currentTime = 0;
      } catch {}
      this.activeCallAudio = null;
    }
  }

  // --- PLAY INCOMING MESSAGE ALERT (Tone + Vibration + Screen Pulse) ---
  playIncomingMessageAlert(user: UserProfile) {
    // 1. Vibration
    if (user.vibrateOnMessage !== false) {
      this.triggerMessageVibration();
    }

    // 2. Wake lock temporarily if enabled
    if (user.wakeScreenOnMessage !== false) {
      this.requestScreenWakeLock();
      setTimeout(() => this.releaseScreenWakeLock(), 4000);
    }

    // 3. Audio Tone
    const isCustom = user.messageToneId === 'custom' && user.customMessageToneUrl;
    if (isCustom && user.customMessageToneUrl) {
      try {
        const audio = new Audio(user.customMessageToneUrl);
        audio.play().catch(() => {
          this.playSynthesizedMessageTone('pidgex_chirp');
        });
      } catch {
        this.playSynthesizedMessageTone('pidgex_chirp');
      }
    } else {
      const tone = user.messageToneId || 'pidgex_chirp';
      this.playSynthesizedMessageTone(tone);
    }
  }

  // --- PREVIEW SOUND IN SETTINGS ---
  playTonePreview(type: 'call' | 'message', toneId: string, customUrl?: string) {
    this.stopPreview();

    if (toneId === 'custom' && customUrl) {
      try {
        const audio = new Audio(customUrl);
        audio.play().catch((err) => console.warn('Preview play error:', err));
        this.previewAudio = audio;
      } catch (e) {
        console.warn('Custom preview error:', e);
      }
      return;
    }

    if (type === 'call') {
      this.playSynthesizedCallTone(toneId);
    } else {
      this.playSynthesizedMessageTone(toneId);
    }
  }

  stopPreview() {
    if (this.previewAudio) {
      try {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
      } catch {}
      this.previewAudio = null;
    }
  }
}

export const ringtoneManager = new RingtoneAudioManager();
