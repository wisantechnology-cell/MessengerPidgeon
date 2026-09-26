/**
 * Audio recording & synthesized audio utilities for voice messages
 */

// Generate a simple pleasant voice-note WAV audio blob as fallback if mic is unavailable
export function createFallbackVoiceAudio(durationSeconds: number = 3): string {
  try {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * Math.max(1, Math.min(durationSeconds, 10)));
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + numSamples * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count (1 = mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, numSamples * 2, true);

    // Generate a gentle harmonic vocal chime sound wave
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Soft melodic progression: 330Hz (E), 440Hz (A), 554Hz (C#)
      const freq = t < 1.0 ? 330 : t < 2.0 ? 440 : 554;
      const envelope = Math.max(0, 1 - (t % 1) * 0.8) * Math.sin(Math.min(1, t * 5) * Math.PI * 0.5);
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Fallback audio generation failed', e);
    return '';
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
