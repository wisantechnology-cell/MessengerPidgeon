// Shared persistent AudioContext bridge for mobile & desktop voice/video calls.
// Keeping a single AudioContext unlocked inside the user's tap gesture ("Llamar" / "Contestar")
// ensures iOS Safari and Android Chrome play and capture call audio immediately without staying suspended.

let sharedCallAudioCtx: AudioContext | null = null;
let sharedSilentUnlocked = false;

export function getSharedCallAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedCallAudioCtx || sharedCallAudioCtx.state === 'closed') {
    try {
      sharedCallAudioCtx = new AudioCtx({ latencyHint: 'interactive' });
    } catch {
      try {
        sharedCallAudioCtx = new AudioCtx();
      } catch {
        return null;
      }
    }
    sharedSilentUnlocked = false;
  }
  return sharedCallAudioCtx;
}

export async function unlockCallAudio(): Promise<boolean> {
  const ctx = getSharedCallAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Play a 1-sample silent buffer once to fully unlock WebKit / iOS Safari audio output
    if (!sharedSilentUnlocked && ctx.state === 'running') {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate || 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      sharedSilentUnlocked = true;
    }

    return ctx.state === 'running';
  } catch {
    return ctx.state === 'running';
  }
}

export function isCallAudioUnlocked(): boolean {
  return Boolean(sharedCallAudioCtx && sharedCallAudioCtx.state === 'running');
}
