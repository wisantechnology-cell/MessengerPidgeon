import type { FaceTrackingFrame, Point2D } from './faceTracker';
import type { CameraFilterDef } from './filterCatalog';
import type { ThreeFaceFilterEngine } from './threeFaceScene';

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  kind: 'heart' | 'sparkle';
}

const OUTER_LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const INNER_LIP_INDICES = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

export class CanvasFilterRenderer {
  private blurCanvas: HTMLCanvasElement;
  private blurCtx: CanvasRenderingContext2D | null;
  private vignetteCacheKey = '';
  private vignetteCanvas: HTMLCanvasElement;
  private particles: SparkleParticle[] = [];
  private lastBurstMs = 0;

  constructor() {
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = 240;
    this.blurCanvas.height = 320;
    this.blurCtx = this.blurCanvas.getContext('2d');

    this.vignetteCanvas = document.createElement('canvas');
  }

  private drawPointPath(
    ctx: CanvasRenderingContext2D,
    landmarks: Point2D[],
    indices: number[],
    w: number,
    h: number
  ) {
    if (landmarks.length < 468) return;
    const first = landmarks[indices[0]];
    ctx.moveTo(first.x * w, first.y * h);
    for (let i = 1; i < indices.length; i++) {
      const pt = landmarks[indices[i]];
      ctx.lineTo(pt.x * w, pt.y * h);
    }
    ctx.closePath();
  }

  private applyBeautyPass(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    w: number,
    h: number,
    mirrored: boolean,
    face: FaceTrackingFrame,
    beautyAmount: number
  ) {
    if (beautyAmount <= 0.02 || !this.blurCtx) return;

    const bw = 240;
    const bh = Math.max(180, Math.round((bw * h) / Math.max(1, w)));
    if (this.blurCanvas.width !== bw || this.blurCanvas.height !== bh) {
      this.blurCanvas.width = bw;
      this.blurCanvas.height = bh;
    }

    const bctx = this.blurCtx;
    bctx.save();
    bctx.clearRect(0, 0, bw, bh);
    bctx.filter = `blur(${(2.4 + beautyAmount * 3.2).toFixed(1)}px) brightness(1.06)`;
    if (mirrored) {
      bctx.translate(bw, 0);
      bctx.scale(-1, 1);
    }
    this.drawCoveredVideo(bctx, video, bw, bh);
    bctx.restore();
    bctx.filter = 'none';

    ctx.save();
    if (face.detected) {
      const cx = face.faceCenter.x * w;
      const cy = face.faceCenter.y * h;
      const rx = face.faceWidth * w * 0.48;
      const ry = face.faceHeight * h * 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, face.roll, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.globalAlpha = Math.min(0.62, 0.22 + beautyAmount * 0.42);
    ctx.drawImage(this.blurCanvas, 0, 0, w, h);
    ctx.restore();

    // Subtle eye brighten sparkles
    if (face.detected && beautyAmount > 0.25) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.14 * beautyAmount;
      const eyeR = face.interOcularDist * w * 0.26;
      [face.leftEye, face.rightEye].forEach((eye) => {
        const grad = ctx.createRadialGradient(eye.x * w, eye.y * h, 0, eye.x * w, eye.y * h, eyeR);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(eye.x * w, eye.y * h, eyeR, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  private drawCoveredVideo(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    w: number,
    h: number
  ) {
    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const srcAspect = vw / vh;
    const dstAspect = w / h;

    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;

    if (srcAspect > dstAspect) {
      sw = vh * dstAspect;
      sx = (vw - sw) * 0.5;
    } else {
      sh = vw / dstAspect;
      sy = (vh - sh) * 0.5;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  }

  private drawDogAR(
    ctx: CanvasRenderingContext2D,
    face: FaceTrackingFrame,
    w: number,
    h: number,
    elapsedSec: number
  ) {
    if (!face.detected) return;

    const cx = face.faceCenter.x * w;
    const fw = face.faceWidth * w;
    const fh = face.faceHeight * h;

    // 1. Floppy animated dog ears
    const bounce = Math.sin(elapsedSec * 4.5 + face.roll * 4) * 0.08;
    const drawEar = (side: -1 | 1) => {
      const anchorX = face.foreheadTop.x * w + side * fw * 0.44;
      const anchorY = face.foreheadTop.y * h + fh * 0.04;
      ctx.save();
      ctx.translate(anchorX, anchorY);
      ctx.rotate(face.roll + side * (0.35 + bounce));

      // Outer fur ear
      const earGrad = ctx.createLinearGradient(0, 0, side * fw * 0.14, fw * 0.42);
      earGrad.addColorStop(0, '#78350f');
      earGrad.addColorStop(0.55, '#b45309');
      earGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = earGrad;
      ctx.beginPath();
      ctx.moveTo(0, -fw * 0.08);
      ctx.bezierCurveTo(side * fw * 0.3, -fw * 0.1, side * fw * 0.36, fw * 0.25, side * fw * 0.16, fw * 0.44);
      ctx.bezierCurveTo(side * fw * 0.02, fw * 0.46, -side * fw * 0.05, fw * 0.24, 0, -fw * 0.08);
      ctx.fill();

      // Soft inner ear shade
      ctx.fillStyle = 'rgba(253, 230, 138, 0.35)';
      ctx.beginPath();
      ctx.ellipse(side * fw * 0.14, fw * 0.18, fw * 0.055, fw * 0.14, side * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawEar(-1);
    drawEar(1);

    // 2. Wet 3D-shaded dog nose
    const nx = face.noseTip.x * w;
    const ny = face.noseTip.y * h - fw * 0.02;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(face.roll);
    const noseW = fw * 0.15;
    const noseH = fw * 0.11;
    const noseGrad = ctx.createRadialGradient(-noseW * 0.25, -noseH * 0.3, 1, 0, 0, noseW * 1.1);
    noseGrad.addColorStop(0, '#52525b');
    noseGrad.addColorStop(0.45, '#18181b');
    noseGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(0, noseH * 0.72);
    ctx.bezierCurveTo(-noseW * 1.15, noseH * 0.15, -noseW * 0.9, -noseH * 0.78, 0, -noseH * 0.56);
    ctx.bezierCurveTo(noseW * 0.9, -noseH * 0.78, noseW * 1.15, noseH * 0.15, 0, noseH * 0.72);
    ctx.fill();

    // Specular wet highlight
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(-noseW * 0.28, -noseH * 0.22, noseW * 0.22, noseH * 0.12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Reactive wagging tongue (opens cleanly when jawOpen increases!)
    const tongueFactor = Math.max(0, Math.min(1, (face.jawOpen - 0.12) * 2.2));
    if (tongueFactor > 0.05) {
      const mx = face.mouthCenter.x * w;
      const my = face.lowerLip.y * h - fw * 0.02;
      const tongueLen = fw * 0.28 * tongueFactor;
      const tongueWidth = fw * 0.12;
      const wag = Math.sin(elapsedSec * 12) * 0.14;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(face.roll + wag);

      const tGrad = ctx.createLinearGradient(0, 0, 0, tongueLen);
      tGrad.addColorStop(0, '#e11d48');
      tGrad.addColorStop(0.55, '#fb7185');
      tGrad.addColorStop(1, '#fda4af');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.moveTo(-tongueWidth, 0);
      ctx.lineTo(-tongueWidth * 0.9, tongueLen * 0.65);
      ctx.quadraticCurveTo(0, tongueLen * 1.15, tongueWidth * 0.9, tongueLen * 0.65);
      ctx.lineTo(tongueWidth, 0);
      ctx.closePath();
      ctx.fill();

      // Center crease
      ctx.strokeStyle = 'rgba(159, 18, 57, 0.45)';
      ctx.lineWidth = Math.max(1.5, fw * 0.012);
      ctx.beginPath();
      ctx.moveTo(0, tongueLen * 0.12);
      ctx.lineTo(0, tongueLen * 0.78);
      ctx.stroke();
      ctx.restore();
    } else if (cx > 0) {
      // Subtle cheek highlights
      ctx.save();
      ctx.fillStyle = 'rgba(251, 146, 60, 0.14)';
      [face.leftCheek, face.rightCheek].forEach((ck) => {
        ctx.beginPath();
        ctx.arc(ck.x * w, ck.y * h, fw * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  private drawCatAR(
    ctx: CanvasRenderingContext2D,
    face: FaceTrackingFrame,
    w: number,
    h: number,
    elapsedSec: number
  ) {
    if (!face.detected) return;
    const fw = face.faceWidth * w;
    const fh = face.faceHeight * h;

    // 1. Twitching cat ears
    const twitch = Math.sin(elapsedSec * 5.2) * 0.06;
    const drawEar = (side: -1 | 1) => {
      const ex = face.foreheadTop.x * w + side * fw * 0.34;
      const ey = face.foreheadTop.y * h - fh * 0.03;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(face.roll + side * (0.28 + (side === 1 ? twitch : -twitch * 0.5)));

      // Velvet dark-pink / charcoal outer triangle
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(-fw * 0.14, fw * 0.06);
      ctx.quadraticCurveTo(0, -fw * 0.32, fw * 0.14, fw * 0.06);
      ctx.closePath();
      ctx.fill();

      // Soft pink inner ear
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(-fw * 0.08, fw * 0.03);
      ctx.quadraticCurveTo(0, -fw * 0.21, fw * 0.08, fw * 0.03);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawEar(-1);
    drawEar(1);

    // 2. Cute pink nose
    const nx = face.noseTip.x * w;
    const ny = face.noseTip.y * h;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(face.roll);
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, fw * 0.045);
    ctx.bezierCurveTo(-fw * 0.075, -fw * 0.025, -fw * 0.045, -fw * 0.055, 0, -fw * 0.03);
    ctx.bezierCurveTo(fw * 0.045, -fw * 0.055, fw * 0.075, -fw * 0.025, 0, fw * 0.045);
    ctx.fill();
    ctx.restore();

    // 3. Whiskers & cheek blush
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, fw * 0.009);
    ctx.lineCap = 'round';
    [-1, 1].forEach((side) => {
      const ck = side === -1 ? face.leftCheek : face.rightCheek;
      const cx = ck.x * w;
      const cy = ck.y * h;

      // Rose cheek tint
      const blush = ctx.createRadialGradient(cx, cy, 0, cx, cy, fw * 0.11);
      blush.addColorStop(0, 'rgba(244, 114, 182, 0.42)');
      blush.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = blush;
      ctx.beginPath();
      ctx.arc(cx, cy, fw * 0.11, 0, Math.PI * 2);
      ctx.fill();

      // 3 curved whiskers
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nx + side * fw * 0.11, ny + i * fw * 0.032);
        ctx.quadraticCurveTo(
          nx + side * fw * 0.28,
          ny + i * fw * 0.045 - fw * 0.02,
          nx + side * fw * 0.44,
          ny + i * fw * 0.085
        );
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  private drawMakeupGlam(
    ctx: CanvasRenderingContext2D,
    face: FaceTrackingFrame,
    w: number,
    h: number,
    beautyLevel: number
  ) {
    if (!face.detected || face.landmarks.length < 468) return;
    const fw = face.faceWidth * w;
    const intensity = Math.max(0.35, Math.min(1, beautyLevel + 0.35));

    // 1. Rose velvet lip contour
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(219, 39, 119, ${(0.34 * intensity).toFixed(2)})`;
    ctx.beginPath();
    this.drawPointPath(ctx, face.landmarks, OUTER_LIP_INDICES, w, h);
    this.drawPointPath(ctx, face.landmarks, INNER_LIP_INDICES, w, h);
    ctx.fill('evenodd');
    ctx.restore();

    // Subtle lip gloss highlight on lower lip
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255, 228, 238, ${(0.22 * intensity).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(
      face.lowerLip.x * w,
      face.lowerLip.y * h,
      fw * 0.08,
      fw * 0.022,
      face.roll,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 2. Soft peach cheek blush
    ctx.save();
    [face.leftCheek, face.rightCheek].forEach((ck) => {
      const rx = ck.x * w;
      const ry = ck.y * h;
      const rad = fw * 0.15;
      const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rad);
      grad.addColorStop(0, `rgba(251, 113, 133, ${(0.28 * intensity).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(251, 113, 133, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 3. Delicate winged eyeliner along outer eye edges
    ctx.save();
    ctx.strokeStyle = `rgba(15, 23, 42, ${(0.58 * intensity).toFixed(2)})`;
    ctx.lineWidth = Math.max(1.5, fw * 0.012);
    ctx.lineCap = 'round';
    const leftOuter = face.landmarks[33];
    const rightOuter = face.landmarks[263];
    const leftAnchor = leftOuter.x <= rightOuter.x ? leftOuter : rightOuter;
    const rightAnchor = leftOuter.x <= rightOuter.x ? rightOuter : leftOuter;

    ctx.beginPath();
    ctx.moveTo(leftAnchor.x * w, leftAnchor.y * h);
    ctx.lineTo(leftAnchor.x * w - fw * 0.055, leftAnchor.y * h - fw * 0.028);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightAnchor.x * w, rightAnchor.y * h);
    ctx.lineTo(rightAnchor.x * w + fw * 0.055, rightAnchor.y * h - fw * 0.028);
    ctx.stroke();
    ctx.restore();
  }

  private drawButterflies(
    ctx: CanvasRenderingContext2D,
    face: FaceTrackingFrame,
    w: number,
    h: number,
    elapsedSec: number
  ) {
    if (!face.detected) return;
    const fw = face.faceWidth * w;
    const fh = face.faceHeight * h;

    const specs = [
      { ox: -0.34, oy: -0.42, speed: 3.1, phase: 0, scale: 1.0, c1: '#38bdf8', c2: '#818cf8' },
      { ox: 0.36, oy: -0.36, speed: 3.7, phase: 1.6, scale: 0.85, c1: '#f472b6', c2: '#c084fc' },
      { ox: 0.04, oy: -0.58, speed: 2.8, phase: 3.1, scale: 0.72, c1: '#fbbf24', c2: '#fb923c' },
      { ox: -0.45, oy: 0.08, speed: 3.5, phase: 4.4, scale: 0.65, c1: '#a78bfa', c2: '#f472b6' },
    ];

    specs.forEach((b) => {
      const bx =
        face.faceCenter.x * w +
        b.ox * fw +
        Math.sin(elapsedSec * 1.6 + b.phase) * fw * 0.08;
      const by =
        face.faceCenter.y * h +
        b.oy * fh +
        Math.cos(elapsedSec * 2.1 + b.phase) * fw * 0.06;
      const flap = 0.25 + 0.75 * Math.abs(Math.sin(elapsedSec * b.speed * 2 + b.phase));
      const sz = fw * 0.14 * b.scale;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(face.roll + Math.sin(elapsedSec + b.phase) * 0.22);

      // Left and right butterfly wings
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(side * flap, 1);
        const grad = ctx.createLinearGradient(0, -sz, sz, sz);
        grad.addColorStop(0, b.c1);
        grad.addColorStop(1, b.c2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.88;

        // Upper wing
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(sz * 0.4, -sz * 0.9, sz * 1.15, -sz * 0.65, sz * 0.95, 0);
        ctx.closePath();
        ctx.fill();

        // Lower wing
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(sz * 0.9, 0.05 * sz, sz * 0.75, sz * 0.8, sz * 0.15, sz * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Body
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 0.07, sz * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private updateAndDrawParticles(
    ctx: CanvasRenderingContext2D,
    filter: CameraFilterDef,
    face: FaceTrackingFrame,
    w: number,
    h: number,
    dt: number
  ) {
    const now = performance.now();
    const shouldBurst =
      (filter.id === 'hearts_3d_orbit' || filter.id === 'butterfly_anim' || filter.id === 'pidgex_wings_3d') &&
      face.detected;

    if (shouldBurst) {
      const interval = face.smile > 0.35 ? 110 : 340;
      if (now - this.lastBurstMs > interval && this.particles.length < 36) {
        this.lastBurstMs = now;
        const spreadX = (Math.random() - 0.5) * face.faceWidth * w * 1.1;
        const color =
          filter.id === 'hearts_3d_orbit'
            ? ['#fb7185', '#f43f5e', '#fda4af'][Math.floor(Math.random() * 3)]
            : filter.id === 'pidgex_wings_3d'
            ? ['#38bdf8', '#fbbf24', '#e0f2fe'][Math.floor(Math.random() * 3)]
            : ['#c084fc', '#38bdf8', '#fde047'][Math.floor(Math.random() * 3)];

        this.particles.push({
          x: face.faceCenter.x * w + spreadX,
          y: face.foreheadTop.y * h + (Math.random() - 0.3) * face.faceHeight * h * 0.4,
          vx: (Math.random() - 0.5) * 32,
          vy: -45 - Math.random() * 45,
          size: (face.smile > 0.35 ? 11 : 8) + Math.random() * 6,
          alpha: 0.95,
          color,
          kind: filter.id === 'hearts_3d_orbit' ? 'heart' : 'sparkle',
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 0.65;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      if (p.kind === 'heart') {
        const s = p.size * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.5, -s * 1.1, 0, -s * 0.4);
        ctx.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.35, 0, s * 0.4);
        ctx.fill();
      } else {
        const s = p.size * 0.65;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawVignetteAndGrain(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    strength: number,
    grainAmount: number
  ) {
    if (strength > 0) {
      const key = `${w}x${h}-${strength.toFixed(2)}`;
      if (this.vignetteCacheKey !== key) {
        this.vignetteCacheKey = key;
        this.vignetteCanvas.width = w;
        this.vignetteCanvas.height = h;
        const vctx = this.vignetteCanvas.getContext('2d');
        if (vctx) {
          const grad = vctx.createRadialGradient(
            w * 0.5,
            h * 0.48,
            Math.min(w, h) * 0.3,
            w * 0.5,
            h * 0.5,
            Math.max(w, h) * 0.72
          );
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, `rgba(0,0,0,${strength.toFixed(2)})`);
          vctx.fillStyle = grad;
          vctx.fillRect(0, 0, w, h);
        }
      }
      ctx.drawImage(this.vignetteCanvas, 0, 0, w, h);
    }

    if (grainAmount > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${grainAmount * 0.45})`;
      const dots = 120;
      for (let i = 0; i < dots; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
      ctx.restore();
    }
  }

  renderFrame(opts: {
    outputCanvas: HTMLCanvasElement;
    video: HTMLVideoElement;
    mirrored: boolean;
    filter: CameraFilterDef;
    beautyIntensity: number;
    face: FaceTrackingFrame;
    threeEngine: ThreeFaceFilterEngine | null;
    dt: number;
    elapsedSec: number;
  }) {
    const {
      outputCanvas,
      video,
      mirrored,
      filter,
      beautyIntensity,
      face,
      threeEngine,
      dt,
      elapsedSec,
    } = opts;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx || video.readyState < 2) return;

    const w = outputCanvas.width;
    const h = outputCanvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 1. Base video frame with color aesthetic CSS canvas filter
    if (filter.canvasFilterCss) {
      ctx.filter = filter.canvasFilterCss;
    } else {
      ctx.filter = 'none';
    }

    ctx.save();
    if (mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    this.drawCoveredVideo(ctx, video, w, h);
    ctx.restore();
    ctx.filter = 'none';

    // 2. Skin-smoothing Beauty pass (active on beauty filters or subtle default on glam/AR)
    const effectiveBeauty = filter.supportsBeautySlider
      ? beautyIntensity
      : filter.beautyStrength || 0;
    if (effectiveBeauty > 0.02) {
      this.applyBeautyPass(ctx, video, w, h, mirrored, face, effectiveBeauty);
    }

    // 3. Optional warm/cool aesthetic tint wash
    if (filter.warmOverlay) {
      ctx.save();
      ctx.fillStyle = filter.warmOverlay;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 4. Landmark-tracked 2D makeup / animated AR props
    if (filter.id === 'dog_ar') {
      this.drawDogAR(ctx, face, w, h, elapsedSec);
    } else if (filter.id === 'cat_ar') {
      this.drawCatAR(ctx, face, w, h, elapsedSec);
    } else if (filter.id === 'makeup_glam') {
      this.drawMakeupGlam(ctx, face, w, h, effectiveBeauty);
    } else if (filter.id === 'butterfly_anim') {
      this.drawButterflies(ctx, face, w, h, elapsedSec);
    } else if (filter.id === 'hearts_3d_orbit' && face.detected) {
      // Soft rosy cheek blush underneath 3D hearts
      const fw = face.faceWidth * w;
      [face.leftCheek, face.rightCheek].forEach((ck) => {
        const grad = ctx.createRadialGradient(ck.x * w, ck.y * h, 0, ck.x * w, ck.y * h, fw * 0.13);
        grad.addColorStop(0, 'rgba(251, 113, 133, 0.3)');
        grad.addColorStop(1, 'rgba(251, 113, 133, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ck.x * w, ck.y * h, fw * 0.13, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Composite Three.js 3D WebGL props directly onto outputCanvas (baked into photos & video!)
    if (filter.is3D && threeEngine) {
      threeEngine.resize(w, h);
      const rendered3D = threeEngine.renderFilter(filter.id, face, dt, elapsedSec);
      if (rendered3D) {
        ctx.drawImage(threeEngine.canvas, 0, 0, w, h);
      }
    }

    // 6. Animated floating particles (hearts / sparkles)
    this.updateAndDrawParticles(ctx, filter, face, w, h, dt);

    // 7. Cinematic vignette & analog grain
    if (filter.vignetteStrength || filter.grainAmount) {
      this.drawVignetteAndGrain(
        ctx,
        w,
        h,
        filter.vignetteStrength || 0,
        filter.grainAmount || 0
      );
    }

    ctx.restore();
  }
}
