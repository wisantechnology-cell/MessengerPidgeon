import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface Point2D {
  x: number;
  y: number;
  z: number;
}

export interface FaceTrackingFrame {
  detected: boolean;
  landmarks: Point2D[];
  noseTip: Point2D;
  noseBridge: Point2D;
  foreheadTop: Point2D;
  chinBottom: Point2D;
  leftEye: Point2D;
  rightEye: Point2D;
  leftCheek: Point2D;
  rightCheek: Point2D;
  mouthCenter: Point2D;
  upperLip: Point2D;
  lowerLip: Point2D;
  faceCenter: Point2D;
  interOcularDist: number;
  faceWidth: number;
  faceHeight: number;
  roll: number;
  yaw: number;
  pitch: number;
  jawOpen: number;
  smile: number;
  leftBlink: number;
  rightBlink: number;
}

const DEFAULT_POINT: Point2D = { x: 0.5, y: 0.5, z: 0 };

const EMPTY_FRAME: FaceTrackingFrame = {
  detected: false,
  landmarks: [],
  noseTip: DEFAULT_POINT,
  noseBridge: DEFAULT_POINT,
  foreheadTop: DEFAULT_POINT,
  chinBottom: DEFAULT_POINT,
  leftEye: DEFAULT_POINT,
  rightEye: DEFAULT_POINT,
  leftCheek: DEFAULT_POINT,
  rightCheek: DEFAULT_POINT,
  mouthCenter: DEFAULT_POINT,
  upperLip: DEFAULT_POINT,
  lowerLip: DEFAULT_POINT,
  faceCenter: DEFAULT_POINT,
  interOcularDist: 0.14,
  faceWidth: 0.34,
  faceHeight: 0.45,
  roll: 0,
  yaw: 0,
  pitch: 0,
  jawOpen: 0,
  smile: 0,
  leftBlink: 0,
  rightBlink: 0,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getScore(
  categories: Array<{ categoryName: string; score: number }> | undefined,
  name: string
): number {
  if (!categories) return 0;
  const hit = categories.find((c) => c.categoryName === name);
  return hit ? hit.score : 0;
}

export class FaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private initPromise: Promise<boolean> | null = null;
  private lastVideoTime = -1;
  private latestFrame: FaceTrackingFrame = EMPTY_FRAME;
  private disposed = false;

  async init(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const wasmLocalUrl = '/mediapipe/wasm';
        const wasmCdnUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks(wasmLocalUrl);
        } catch {
          vision = await FilesetResolver.forVisionTasks(wasmCdnUrl);
        }

        if (this.disposed) return false;

        const modelLocal = '/mediapipe/face_landmarker.task';
        const modelCdn =
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

        const createWithOptions = async (modelAssetPath: string, delegate: 'GPU' | 'CPU') => {
          return FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath,
              delegate,
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        };

        try {
          this.landmarker = await createWithOptions(modelLocal, 'GPU');
        } catch {
          try {
            this.landmarker = await createWithOptions(modelLocal, 'CPU');
          } catch {
            try {
              this.landmarker = await createWithOptions(modelCdn, 'GPU');
            } catch {
              this.landmarker = await createWithOptions(modelCdn, 'CPU');
            }
          }
        }

        return Boolean(this.landmarker);
      } catch (err) {
        console.warn('FaceLandmarker initialization failed:', err);
        return false;
      }
    })();

    return this.initPromise;
  }

  detect(video: HTMLVideoElement, mirrored: boolean): FaceTrackingFrame {
    if (
      !this.landmarker ||
      this.disposed ||
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return this.latestFrame;
    }

    if (video.currentTime === this.lastVideoTime) {
      return this.latestFrame;
    }
    this.lastVideoTime = video.currentTime;

    try {
      const nowMs = performance.now();
      const result = this.landmarker.detectForVideo(video, nowMs);
      const rawLandmarks = result.faceLandmarks?.[0];

      if (!rawLandmarks || rawLandmarks.length < 468) {
        this.latestFrame = { ...EMPTY_FRAME, detected: false };
        return this.latestFrame;
      }

      const mapPt = (idx: number): Point2D => {
        const p = rawLandmarks[idx] || DEFAULT_POINT;
        return {
          x: mirrored ? 1 - p.x : p.x,
          y: p.y,
          z: p.z || 0,
        };
      };

      const landmarks: Point2D[] = rawLandmarks.map((p) => ({
        x: mirrored ? 1 - p.x : p.x,
        y: p.y,
        z: p.z || 0,
      }));

      // Note: When mirrored, MediaPipe's subject left eye (idx 33/133/468) swaps horizontal side visually.
      const pt33 = mapPt(33);
      const pt263 = mapPt(263);
      const leftEye = pt33.x <= pt263.x ? pt33 : pt263;
      const rightEye = pt33.x <= pt263.x ? pt263 : pt33;

      const noseTip = mapPt(1);
      const noseBridge = mapPt(168);
      const foreheadTop = mapPt(10);
      const chinBottom = mapPt(152);
      const upperLip = mapPt(13);
      const lowerLip = mapPt(14);
      const mouthCenter: Point2D = {
        x: (upperLip.x + lowerLip.x) * 0.5,
        y: (upperLip.y + lowerLip.y) * 0.5,
        z: (upperLip.z + lowerLip.z) * 0.5,
      };

      const cheekA = mapPt(234);
      const cheekB = mapPt(454);
      const leftCheek = cheekA.x <= cheekB.x ? mapPt(50) : mapPt(280);
      const rightCheek = cheekA.x <= cheekB.x ? mapPt(280) : mapPt(50);

      const leftSide = mapPt(234);
      const rightSide = mapPt(454);
      const faceWidth = Math.hypot(rightSide.x - leftSide.x, rightSide.y - leftSide.y);
      const faceHeight = Math.hypot(chinBottom.x - foreheadTop.x, chinBottom.y - foreheadTop.y);
      const interOcularDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

      const eyeMidX = (leftEye.x + rightEye.x) * 0.5;
      const eyeMidY = (leftEye.y + rightEye.y) * 0.5;
      const faceCenter: Point2D = {
        x: (foreheadTop.x + chinBottom.x) * 0.5,
        y: (foreheadTop.y + chinBottom.y) * 0.5,
        z: noseBridge.z,
      };

      // Roll from eye axis angle
      const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      // Yaw & pitch from facialTransformationMatrix or geometric fallback
      let yaw = 0;
      let pitch = 0;
      const matrixData = result.facialTransformationMatrixes?.[0]?.data;
      if (matrixData && matrixData.length >= 16) {
        // Row-major / column-major MediaPipe 4x4 transformation matrix rotation check
        // MediaPipe outputs column-major 4x4: m[0..3]=col0, m[4..7]=col1, m[8..11]=col2
        const m02 = matrixData[8];
        const m12 = matrixData[9];
        const m22 = matrixData[10];
        yaw = clamp(Math.asin(clamp(m02, -0.95, 0.95)), -0.9, 0.9);
        pitch = clamp(Math.atan2(-m12, m22), -0.7, 0.7);
        if (mirrored) {
          yaw = -yaw;
        }
      } else {
        const noseOffset = (noseTip.x - eyeMidX) / Math.max(0.05, faceWidth * 0.5);
        yaw = clamp(noseOffset * 0.65, -0.8, 0.8);
        const vertRatio = (noseTip.y - eyeMidY) / Math.max(0.05, faceHeight);
        pitch = clamp((vertRatio - 0.22) * 1.4, -0.6, 0.6);
      }

      const blendCategories = result.faceBlendshapes?.[0]?.categories;
      const jawOpen = clamp(getScore(blendCategories, 'jawOpen'), 0, 1);
      const smile = clamp(
        (getScore(blendCategories, 'mouthSmileLeft') +
          getScore(blendCategories, 'mouthSmileRight')) *
          0.5,
        0,
        1
      );
      const leftBlink = clamp(
        getScore(blendCategories, mirrored ? 'eyeBlinkRight' : 'eyeBlinkLeft'),
        0,
        1
      );
      const rightBlink = clamp(
        getScore(blendCategories, mirrored ? 'eyeBlinkLeft' : 'eyeBlinkRight'),
        0,
        1
      );

      this.latestFrame = {
        detected: true,
        landmarks,
        noseTip,
        noseBridge,
        foreheadTop,
        chinBottom,
        leftEye,
        rightEye,
        leftCheek,
        rightCheek,
        mouthCenter,
        upperLip,
        lowerLip,
        faceCenter,
        interOcularDist: Math.max(0.04, interOcularDist),
        faceWidth: Math.max(0.08, faceWidth),
        faceHeight: Math.max(0.1, faceHeight),
        roll,
        yaw,
        pitch,
        jawOpen,
        smile,
        leftBlink,
        rightBlink,
      };
    } catch (err) {
      console.warn('Face detection frame skipped:', err);
    }

    return this.latestFrame;
  }

  dispose() {
    this.disposed = true;
    try {
      this.landmarker?.close();
    } catch {}
    this.landmarker = null;
  }
}
