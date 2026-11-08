// Lightweight Web Audio API sound generator for PidgeX
class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSend() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio policy errors
    }
  }

  playBirdChirp() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Chirp 1 - High frequency sweep (2800Hz -> 4200Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2800, now);
      osc1.frequency.exponentialRampToValueAtTime(4200, now + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.12);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      // Chirp 2 - Second cheerful chirp ("pío pío") at t + 0.15s
      const now2 = now + 0.16;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(3000, now2);
      osc2.frequency.exponentialRampToValueAtTime(4600, now2 + 0.09);
      osc2.frequency.exponentialRampToValueAtTime(3500, now2 + 0.15);

      gain2.gain.setValueAtTime(0.22, now2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.16);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now2);
      osc2.stop(now2 + 0.16);
    } catch (e) {
      // Ignore
    }
  }

  playReceive() {
    this.playBirdChirp();
  }

  playNotification() {
    this.playBirdChirp();
  }
}

export const soundEffects = new SoundEffects();
