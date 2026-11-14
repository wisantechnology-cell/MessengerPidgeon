import { DigitalAvatarConfig } from '../types';

export const DEFAULT_DIGITAL_AVATAR: DigitalAvatarConfig = {
  skinTone: '#f1c29b',
  hairStyle: 'short',
  hairColor: '#2d1f18',
  eyeColor: '#2563eb',
  outfit: 'cyber',
  outfitColor: '#0284c7',
  accessory: 'none',
  auraColor: '#38bdf8',
  expression: 'happy',
};

export interface AvatarAnimState {
  time: number;
  blink: number; // 0 = open, 1 = closed
  mouthOpen: number; // 0..1 talking amplitude
  expression?: DigitalAvatarConfig['expression'];
}

function shadeHex(hex: string, amount: number): string {
  const clean = (hex || '#888888').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '8').slice(0, 6);
  const num = parseInt(full, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export async function extractTraitsFromPhotoCanvas(
  dataUrl: string
): Promise<Partial<DigitalAvatarConfig>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 96;
        c.height = 96;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve({});
        ctx.drawImage(img, 0, 0, 96, 96);

        const avgRegion = (x: number, y: number, w: number, h: number) => {
          const data = ctx.getImageData(x, y, w, h).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (!count) return '#e0ac8b';
          const toHex = (n: number) => Math.round(n / count).toString(16).padStart(2, '0');
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        };

        const skinTone = avgRegion(36, 38, 24, 24);
        const hairColor = avgRegion(34, 10, 28, 14);
        const outfitColor = avgRegion(32, 78, 32, 14);
        resolve({ skinTone, hairColor, outfitColor });
      } catch {
        resolve({});
      }
    };
    img.onerror = () => resolve({});
    img.src = dataUrl;
  });
}

export function drawDigitalAvatar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: DigitalAvatarConfig,
  anim: AvatarAnimState
) {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) / 240;
  const exp = anim.expression || config.expression || 'happy';
  const bob = Math.sin(anim.time * 2.4) * 2.5 * s;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Futuristic backdrop aura
  const bgGrad = ctx.createRadialGradient(cx, cy - 10 * s, 10 * s, cx, cy, 120 * s);
  bgGrad.addColorStop(0, shadeHex(config.auraColor, 30));
  bgGrad.addColorStop(0.55, '#0f172a');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle orbital ring
  ctx.save();
  ctx.strokeStyle = `${config.auraColor}55`;
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(cx, cy, 104 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.translate(cx, cy + bob);

  // Back hair layer (for long/bob/curly)
  if (config.hairStyle === 'long' || config.hairStyle === 'bob' || config.hairStyle === 'curly') {
    ctx.fillStyle = shadeHex(config.hairColor, -18);
    ctx.beginPath();
    if (config.hairStyle === 'long') {
      ctx.roundRect(-56 * s, -48 * s, 112 * s, 130 * s, 44 * s);
    } else if (config.hairStyle === 'bob') {
      ctx.roundRect(-55 * s, -50 * s, 110 * s, 92 * s, 40 * s);
    } else {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 9) * Math.PI + Math.PI;
        const rx = Math.cos(angle) * 52 * s;
        const ry = Math.sin(angle) * 46 * s - 12 * s;
        ctx.moveTo(rx, ry);
        ctx.arc(rx, ry, 20 * s, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  // Shoulders & Outfit
  ctx.save();
  ctx.fillStyle = config.outfitColor;
  ctx.beginPath();
  ctx.moveTo(-78 * s, 125 * s);
  ctx.quadraticCurveTo(-72 * s, 54 * s, -22 * s, 48 * s);
  ctx.lineTo(22 * s, 48 * s);
  ctx.quadraticCurveTo(72 * s, 54 * s, 78 * s, 125 * s);
  ctx.closePath();
  ctx.fill();

  if (config.outfit === 'cyber') {
    ctx.strokeStyle = config.auraColor;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-30 * s, 56 * s);
    ctx.lineTo(0, 88 * s);
    ctx.lineTo(30 * s, 56 * s);
    ctx.stroke();
  } else if (config.outfit === 'suit') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-16 * s, 50 * s);
    ctx.lineTo(0, 95 * s);
    ctx.lineTo(16 * s, 50 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = config.auraColor;
    ctx.beginPath();
    ctx.moveTo(-4 * s, 60 * s);
    ctx.lineTo(4 * s, 60 * s);
    ctx.lineTo(6 * s, 95 * s);
    ctx.lineTo(0, 106 * s);
    ctx.lineTo(-6 * s, 95 * s);
    ctx.closePath();
    ctx.fill();
  } else if (config.outfit === 'hoodie') {
    ctx.strokeStyle = shadeHex(config.outfitColor, 45);
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(0, 52 * s, 26 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (config.outfit === 'astronaut') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-35 * s, 64 * s, 70 * s, 32 * s);
    ctx.fillStyle = config.auraColor;
    ctx.fillRect(-20 * s, 72 * s, 16 * s, 8 * s);
  }
  ctx.restore();

  // Neck
  ctx.fillStyle = shadeHex(config.skinTone, -18);
  ctx.beginPath();
  ctx.roundRect(-15 * s, 28 * s, 30 * s, 32 * s, 10 * s);
  ctx.fill();

  // Ears
  ctx.fillStyle = shadeHex(config.skinTone, -10);
  ctx.beginPath();
  ctx.ellipse(-46 * s, -4 * s, 9 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(46 * s, -4 * s, 9 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headGrad = ctx.createRadialGradient(-12 * s, -22 * s, 8 * s, 0, -6 * s, 56 * s);
  headGrad.addColorStop(0, shadeHex(config.skinTone, 14));
  headGrad.addColorStop(1, config.skinTone);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, -10 * s, 45 * s, 53 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft cheeks blush
  ctx.fillStyle = exp === 'love' ? 'rgba(244,63,94,0.38)' : 'rgba(244,114,182,0.20)';
  ctx.beginPath();
  ctx.ellipse(-25 * s, 6 * s, 10 * s, 5.5 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(25 * s, 6 * s, 10 * s, 5.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (left & right with smooth blink + expression)
  const drawEye = (ex: number, isRight: boolean) => {
    const isWinkClosed = exp === 'wink' && isRight;
    const closedAmount = isWinkClosed ? 1 : anim.blink;
    const eyeH = Math.max(1.5, 11 * (1 - closedAmount)) * s;

    if (exp === 'love' && closedAmount < 0.5) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = `${18 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤', ex, -11 * s);
      return;
    }

    if (closedAmount > 0.78) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, -10 * s, 9 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      return;
    }

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, -12 * s, 10.5 * s, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris + pupil
    ctx.fillStyle = config.eyeColor;
    ctx.beginPath();
    ctx.arc(ex, -12 * s, Math.min(6.2 * s, eyeH), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex, -12 * s, Math.min(3.3 * s, eyeH * 0.7), 0, Math.PI * 2);
    ctx.fill();

    // Catchlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 2.5 * s, -14.5 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(-19 * s, false);
  drawEye(19 * s, true);

  // Eyebrows
  ctx.strokeStyle = shadeHex(config.hairColor, -15);
  ctx.lineWidth = 3.5 * s;
  ctx.lineCap = 'round';
  const browLift = exp === 'surprised' ? -5 * s : exp === 'happy' ? -2 * s : 0;
  ctx.beginPath();
  ctx.moveTo(-29 * s, -26 * s + browLift);
  ctx.quadraticCurveTo(-19 * s, -30 * s + browLift, -10 * s, -26 * s + browLift);
  ctx.moveTo(10 * s, -26 * s + browLift);
  ctx.quadraticCurveTo(19 * s, -30 * s + browLift, 29 * s, -26 * s + browLift);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = shadeHex(config.skinTone, -28);
  ctx.lineWidth = 2.2 * s;
  ctx.beginPath();
  ctx.moveTo(0, -8 * s);
  ctx.quadraticCurveTo(4 * s, 2 * s, -1 * s, 4 * s);
  ctx.stroke();

  // Animated Mouth (supports speech/audio lip-sync + facial expressions)
  ctx.save();
  const talkAmt = Math.min(1, Math.max(0, anim.mouthOpen));
  if (talkAmt > 0.08) {
    const openH = (4 + talkAmt * 11) * s;
    const openW = (11 + (1 - talkAmt * 0.3) * 4) * s;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 20 * s, openW, openH, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tongue hint
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(0, 20 * s + openH * 0.45, openW * 0.55, openH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Upper teeth
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-openW * 0.55, 20 * s - openH * 0.78, openW * 1.1, openH * 0.32);
  } else if (exp === 'surprised') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 21 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (exp === 'cool') {
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11 * s, 21 * s);
    ctx.quadraticCurveTo(2 * s, 24 * s, 14 * s, 17 * s);
    ctx.stroke();
  } else {
    // Happy / Love / Wink smile
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-15 * s, 17 * s);
    ctx.quadraticCurveTo(0, 31 * s, 15 * s, 17 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
  }
  ctx.restore();

  // Top/Front Hair
  if (config.hairStyle !== 'none') {
    ctx.fillStyle = config.hairColor;
    ctx.beginPath();
    if (config.hairStyle === 'short' || config.hairStyle === 'bob' || config.hairStyle === 'long') {
      ctx.arc(0, -34 * s, 46 * s, Math.PI, Math.PI * 2);
      ctx.quadraticCurveTo(46 * s, -20 * s, 38 * s, -22 * s);
      ctx.quadraticCurveTo(10 * s, -36 * s, -38 * s, -22 * s);
      ctx.quadraticCurveTo(-46 * s, -20 * s, -46 * s, -34 * s);
      ctx.fill();
    } else if (config.hairStyle === 'spiky') {
      ctx.moveTo(-46 * s, -24 * s);
      const spikes = [-40, -24, -8, 8, 24, 40];
      spikes.forEach((sx, idx) => {
        ctx.lineTo((sx - 6) * s, -52 * s - (idx % 2) * 14 * s);
        ctx.lineTo((sx + 6) * s, -36 * s);
      });
      ctx.lineTo(46 * s, -24 * s);
      ctx.quadraticCurveTo(0, -40 * s, -46 * s, -24 * s);
      ctx.fill();
    } else if (config.hairStyle === 'mohawk') {
      ctx.roundRect(-14 * s, -82 * s, 28 * s, 46 * s, 12 * s);
      ctx.fill();
    } else if (config.hairStyle === 'bun') {
      ctx.arc(0, -70 * s, 20 * s, 0, Math.PI * 2);
      ctx.arc(0, -35 * s, 46 * s, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (config.hairStyle === 'curly') {
      for (let x = -38; x <= 38; x += 15) {
        ctx.moveTo(x * s, -44 * s);
        ctx.arc(x * s, -46 * s, 16 * s, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  // Accessories
  if (config.accessory === 'glasses' || config.accessory === 'sunglasses') {
    ctx.strokeStyle = config.accessory === 'sunglasses' ? '#0f172a' : '#e2e8f0';
    ctx.lineWidth = 3 * s;
    ctx.fillStyle = config.accessory === 'sunglasses' ? 'rgba(15,23,42,0.85)' : 'rgba(56,189,248,0.12)';
    ctx.beginPath();
    ctx.roundRect(-34 * s, -22 * s, 28 * s, 19 * s, 6 * s);
    ctx.roundRect(6 * s, -22 * s, 28 * s, 19 * s, 6 * s);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6 * s, -13 * s);
    ctx.lineTo(6 * s, -13 * s);
    ctx.stroke();
  } else if (config.accessory === 'headphones') {
    ctx.strokeStyle = config.auraColor;
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.arc(0, -14 * s, 52 * s, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-56 * s, -18 * s, 14 * s, 30 * s, 7 * s);
    ctx.roundRect(42 * s, -18 * s, 14 * s, 30 * s, 7 * s);
    ctx.fill();
  } else if (config.accessory === 'crown') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-24 * s, -54 * s);
    ctx.lineTo(-28 * s, -80 * s);
    ctx.lineTo(-10 * s, -66 * s);
    ctx.lineTo(0, -86 * s);
    ctx.lineTo(10 * s, -66 * s);
    ctx.lineTo(28 * s, -80 * s);
    ctx.lineTo(24 * s, -54 * s);
    ctx.closePath();
    ctx.fill();
  } else if (config.accessory === 'halo') {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.ellipse(0, -76 * s, 30 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
