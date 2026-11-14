import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { FaceTrackingFrame } from './faceTracker';

// Pre-allocated math helpers (zero per-frame GC allocations)
const _targetPos = new THREE.Vector3();
const _targetEuler = new THREE.Euler();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createHeartShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.25 * scale);
  s.bezierCurveTo(0, 0.55 * scale, -0.45 * scale, 0.55 * scale, -0.45 * scale, 0.15 * scale);
  s.bezierCurveTo(-0.45 * scale, -0.18 * scale, 0, -0.36 * scale, 0, -0.52 * scale);
  s.bezierCurveTo(0, -0.36 * scale, 0.45 * scale, -0.18 * scale, 0.45 * scale, 0.15 * scale);
  s.bezierCurveTo(0.45 * scale, 0.55 * scale, 0, 0.55 * scale, 0, 0.25 * scale);
  return s;
}

function createWingBladeShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.28, 0.14, 0.72, 0.42, 0.96, 0.68);
  s.bezierCurveTo(0.75, 0.48, 0.52, 0.34, 0.38, 0.22);
  s.bezierCurveTo(0.62, 0.26, 0.86, 0.38, 1.05, 0.48);
  s.bezierCurveTo(0.8, 0.22, 0.55, 0.12, 0.34, 0.04);
  s.bezierCurveTo(0.55, 0.02, 0.78, 0.08, 0.94, 0.14);
  s.bezierCurveTo(0.66, -0.06, 0.36, -0.14, 0, -0.1);
  s.closePath();
  return s;
}

function createTeardropLensShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.26, 0.12);
  s.bezierCurveTo(-0.08, 0.16, 0.14, 0.15, 0.24, 0.06);
  s.bezierCurveTo(0.28, -0.05, 0.2, -0.22, 0.04, -0.24);
  s.bezierCurveTo(-0.14, -0.25, -0.26, -0.14, -0.28, 0.0);
  s.bezierCurveTo(-0.29, 0.07, -0.28, 0.11, -0.26, 0.12);
  return s;
}

function createMasqueradeHalfShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.04, -0.08);
  s.bezierCurveTo(0.16, 0.04, 0.36, 0.18, 0.58, 0.26);
  s.bezierCurveTo(0.66, 0.28, 0.7, 0.16, 0.62, 0.02);
  s.bezierCurveTo(0.54, -0.14, 0.36, -0.2, 0.16, -0.16);
  s.bezierCurveTo(0.1, -0.14, 0.06, -0.11, 0.04, -0.08);

  const eyeHole = new THREE.Path();
  eyeHole.moveTo(0.18, -0.02);
  eyeHole.bezierCurveTo(0.22, 0.07, 0.42, 0.08, 0.48, 0.01);
  eyeHole.bezierCurveTo(0.44, -0.09, 0.24, -0.1, 0.18, -0.02);
  s.holes.push(eyeHole);
  return s;
}

function buildRoyalCrownGroup(
  goldMat: THREE.Material,
  darkGoldMat: THREE.Material,
  rubyMat: THREE.Material,
  sapphireMat: THREE.Material,
  emeraldMat: THREE.Material,
  haloMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'forehead';

  // 1. Primary circular band
  const bandGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.14, 36, 1, true);
  const band = new THREE.Mesh(bandGeo, goldMat);
  band.position.y = 0.07;
  root.add(band);

  // 2. Inner bevel rim
  const rimGeo = new THREE.TorusGeometry(0.47, 0.028, 12, 42);
  const rim = new THREE.Mesh(rimGeo, darkGoldMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  root.add(rim);

  // 3. Top trim ring
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.022, 12, 42), goldMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.14;
  root.add(topRim);

  // 4-9. Crown spires & mounted gems
  const spireCount = 7;
  const gemMats = [rubyMat, sapphireMat, emeraldMat];
  for (let i = 0; i < spireCount; i++) {
    const angle = (i / spireCount) * Math.PI * 2;
    const isCenterFront = i === 0;
    const spireHeight = isCenterFront ? 0.34 : 0.24;
    const spireRadius = 0.465;

    const spireGeo = new THREE.ConeGeometry(isCenterFront ? 0.085 : 0.065, spireHeight, 6);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.set(
      Math.sin(angle) * spireRadius,
      0.14 + spireHeight * 0.48,
      Math.cos(angle) * spireRadius
    );
    spire.rotation.z = -Math.sin(angle) * 0.14;
    spire.rotation.x = Math.cos(angle) * 0.14;
    root.add(spire);

    const gemGeo = new THREE.OctahedronGeometry(isCenterFront ? 0.065 : 0.045, 0);
    const gem = new THREE.Mesh(gemGeo, gemMats[i % gemMats.length]);
    gem.position.set(
      Math.sin(angle) * (spireRadius + 0.03),
      0.14 + spireHeight + 0.02,
      Math.cos(angle) * (spireRadius + 0.03)
    );
    root.add(gem);
  }

  // Front bezel jewel on band
  const frontBezel = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 10, 20), darkGoldMat);
  frontBezel.position.set(0, 0.08, 0.475);
  root.add(frontBezel);
  const frontRuby = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), rubyMat);
  frontRuby.position.set(0, 0.08, 0.485);
  root.add(frontRuby);

  // Animated floating celestial halo ring
  const haloGroup = new THREE.Group();
  haloGroup.name = 'animatedHalo';
  haloGroup.position.y = 0.62;
  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.016, 12, 48), haloMat);
  haloRing.rotation.x = Math.PI / 2;
  haloGroup.add(haloRing);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), haloMat);
    star.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    haloGroup.add(star);
  }
  root.add(haloGroup);

  return root;
}

function buildPidgeXCelestialGroup(
  skyGoldMat: THREE.Material,
  skyGlowMat: THREE.Material,
  silverMat: THREE.Material,
  sapphireMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'forehead';

  const wingShape = createWingBladeShape();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });

  // Left & right temple wings
  const leftWingPivot = new THREE.Group();
  leftWingPivot.name = 'leftWing';
  leftWingPivot.position.set(-0.46, -0.08, 0.12);
  const leftWingMesh = new THREE.Mesh(wingGeo, skyGlowMat);
  leftWingMesh.scale.set(-0.72, 0.72, 1);
  leftWingMesh.rotation.y = 0.25;
  leftWingPivot.add(leftWingMesh);

  const leftInnerWing = new THREE.Mesh(wingGeo, skyGoldMat);
  leftInnerWing.scale.set(-0.5, 0.5, 1.2);
  leftInnerWing.position.set(-0.04, 0.06, 0.03);
  leftWingPivot.add(leftInnerWing);
  root.add(leftWingPivot);

  const rightWingPivot = new THREE.Group();
  rightWingPivot.name = 'rightWing';
  rightWingPivot.position.set(0.46, -0.08, 0.12);
  const rightWingMesh = new THREE.Mesh(wingGeo, skyGlowMat);
  rightWingMesh.scale.set(0.72, 0.72, 1);
  rightWingMesh.rotation.y = -0.25;
  rightWingPivot.add(rightWingMesh);

  const rightInnerWing = new THREE.Mesh(wingGeo, skyGoldMat);
  rightInnerWing.scale.set(0.5, 0.5, 1.2);
  rightInnerWing.position.set(0.04, 0.06, 0.03);
  rightWingPivot.add(rightInnerWing);
  root.add(rightWingPivot);

  // Forehead Tiara Arc
  const tiaraArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.49, 0.022, 12, 42, Math.PI * 1.15),
    silverMat
  );
  tiaraArc.rotation.x = Math.PI / 2;
  tiaraArc.rotation.z = -Math.PI * 0.075;
  tiaraArc.position.y = -0.06;
  root.add(tiaraArc);

  // Center PidgeX Diamond Crest
  const crestFrame = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), skyGoldMat);
  crestFrame.scale.set(0.85, 1.35, 0.45);
  crestFrame.position.set(0, 0.04, 0.5);
  root.add(crestFrame);

  const crestGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), sapphireMat);
  crestGem.scale.set(0.85, 1.35, 0.55);
  crestGem.position.set(0, 0.04, 0.52);
  root.add(crestGem);

  // Orbiting celestial aura ring
  const auraGroup = new THREE.Group();
  auraGroup.name = 'animatedAura';
  auraGroup.position.set(0, 0.34, 0.05);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 2 === 0 ? 0.038 : 0.024, 0),
      i % 2 === 0 ? skyGoldMat : skyGlowMat
    );
    node.position.set(Math.cos(a) * 0.54, Math.sin(a * 2) * 0.04, Math.sin(a) * 0.42);
    auraGroup.add(node);
  }
  root.add(auraGroup);

  return root;
}

function buildCyberVisorGroup(
  chromeMat: THREE.Material,
  darkObsidianMat: THREE.Material,
  neonCyanMat: THREE.Material,
  neonMagentaMat: THREE.Material,
  visorGlassMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'eyes';

  // Curved shield visor across eyes
  const shieldGeo = new THREE.CylinderGeometry(
    0.58,
    0.56,
    0.26,
    32,
    1,
    true,
    -Math.PI * 0.38,
    Math.PI * 0.76
  );
  const shield = new THREE.Mesh(shieldGeo, visorGlassMat);
  shield.position.set(0, 0.0, -0.14);
  root.add(shield);

  // Upper chrome brow rail
  const topRail = new THREE.Mesh(
    new THREE.TorusGeometry(0.585, 0.022, 10, 36, Math.PI * 0.78),
    chromeMat
  );
  topRail.rotation.x = Math.PI / 2;
  topRail.rotation.z = -Math.PI * 0.39 + Math.PI * 0.5;
  topRail.position.set(0, 0.13, -0.14);
  root.add(topRail);

  // Lower obsidian rim
  const bottomRail = new THREE.Mesh(
    new THREE.TorusGeometry(0.565, 0.018, 10, 36, Math.PI * 0.76),
    darkObsidianMat
  );
  bottomRail.rotation.x = Math.PI / 2;
  bottomRail.rotation.z = -Math.PI * 0.38 + Math.PI * 0.5;
  bottomRail.position.set(0, -0.13, -0.14);
  root.add(bottomRail);

  // Left & right cyber ear pods
  [-1, 1].forEach((side) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.11, 12), darkObsidianMat);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(side * 0.56, 0.0, 0.06);
    root.add(pod);

    const emitterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.014, 8, 24),
      side === -1 ? neonCyanMat : neonMagentaMat
    );
    emitterRing.rotation.y = Math.PI / 2;
    emitterRing.position.set(side * 0.615, 0.0, 0.06);
    root.add(emitterRing);
  });

  // Animated holographic scanner arc over right eye
  const holoGroup = new THREE.Group();
  holoGroup.name = 'holoScanner';
  holoGroup.position.set(0.24, 0.02, 0.45);
  const reticle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 28, Math.PI * 1.4), neonCyanMat);
  holoGroup.add(reticle);
  const innerReticle = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.006, 8, 24, Math.PI * 1.2),
    neonMagentaMat
  );
  innerReticle.rotation.z = Math.PI;
  holoGroup.add(innerReticle);
  root.add(holoGroup);

  return root;
}

function buildHeartsOrbitGroup(
  crimsonMat: THREE.Material,
  roseGoldMat: THREE.Material,
  pinkPearlMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'forehead';

  const heartShape = createHeartShape(0.24);
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 3,
  });
  heartGeo.center();

  const orbitGroup = new THREE.Group();
  orbitGroup.name = 'heartsOrbit';
  orbitGroup.position.set(0, 0.25, 0.05);

  const mats = [crimsonMat, roseGoldMat, pinkPearlMat];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const heart = new THREE.Mesh(heartGeo, mats[i % mats.length]);
    const radius = 0.62;
    heart.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.08, Math.sin(angle) * radius);
    heart.userData.baseAngle = angle;
    heart.userData.radius = radius;
    const sc = i % 2 === 0 ? 1.0 : 0.76;
    heart.scale.set(sc, sc, sc);
    orbitGroup.add(heart);
  }
  root.add(orbitGroup);

  return root;
}

function buildMasqueradeGroup(
  obsidianMat: THREE.Material,
  goldMat: THREE.Material,
  sapphireMat: THREE.Material,
  pearlMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'eyes';

  const halfShape = createMasqueradeHalfShape();
  const halfGeo = new THREE.ExtrudeGeometry(halfShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
  });

  const rightHalf = new THREE.Mesh(halfGeo, obsidianMat);
  rightHalf.position.set(0.0, -0.02, 0.42);
  rightHalf.rotation.y = -0.22;
  root.add(rightHalf);

  const leftHalf = new THREE.Mesh(halfGeo, obsidianMat);
  leftHalf.scale.x = -1;
  leftHalf.position.set(0.0, -0.02, 0.42);
  leftHalf.rotation.y = 0.22;
  root.add(leftHalf);

  // Gold bridge filigree & crest
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.05, 0.2, 12), goldMat);
  bridge.position.set(0, 0.03, 0.45);
  root.add(bridge);

  const crestCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), sapphireMat);
  crestCrown.scale.set(0.85, 1.35, 0.55);
  crestCrown.position.set(0, 0.16, 0.46);
  root.add(crestCrown);

  // Gold side filigree curls
  [-1, 1].forEach((side) => {
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 20, Math.PI * 1.4), goldMat);
    curl.position.set(side * 0.54, 0.18, 0.3);
    curl.rotation.z = side * 0.5;
    curl.rotation.y = -side * 0.45;
    root.add(curl);

    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), pearlMat);
    pearl.position.set(side * 0.6, 0.24, 0.26);
    root.add(pearl);
  });

  // Floating gold dust motes
  const dustGroup = new THREE.Group();
  dustGroup.name = 'goldDust';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const speck = new THREE.Mesh(new THREE.OctahedronGeometry(0.02, 0), goldMat);
    speck.position.set(Math.cos(a) * 0.72, 0.15 + Math.sin(a * 2) * 0.12, 0.2 + Math.sin(a) * 0.2);
    dustGroup.add(speck);
  }
  root.add(dustGroup);

  return root;
}

function buildAviatorGlassesGroup(
  goldMat: THREE.Material,
  darkLensMat: THREE.Material
): THREE.Group {
  const root = new THREE.Group();
  root.userData.anchor = 'eyes';

  const lensShape = createTeardropLensShape();
  const lensGeo = new THREE.ExtrudeGeometry(lensShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 2,
  });

  // Left & right teardrop lenses
  const leftLens = new THREE.Mesh(lensGeo, darkLensMat);
  leftLens.position.set(-0.27, 0.01, 0.45);
  leftLens.rotation.y = 0.14;
  root.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeo, darkLensMat);
  rightLens.scale.x = -1;
  rightLens.position.set(0.27, 0.01, 0.45);
  rightLens.rotation.y = -0.14;
  root.add(rightLens);

  // Gold metallic rims
  const rimCurveLeft = new THREE.TorusGeometry(0.22, 0.014, 10, 32);
  const leftRim = new THREE.Mesh(rimCurveLeft, goldMat);
  leftRim.scale.set(1.12, 0.92, 1);
  leftRim.position.set(-0.27, -0.02, 0.46);
  leftRim.rotation.y = 0.14;
  root.add(leftRim);

  const rightRim = new THREE.Mesh(rimCurveLeft, goldMat);
  rightRim.scale.set(1.12, 0.92, 1);
  rightRim.position.set(0.27, -0.02, 0.46);
  rightRim.rotation.y = -0.14;
  root.add(rightRim);

  // Double gold nose bridge
  const topBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 10), goldMat);
  topBridge.rotation.z = Math.PI / 2;
  topBridge.position.set(0, 0.12, 0.48);
  root.add(topBridge);

  const midBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14, 10), goldMat);
  midBridge.rotation.z = Math.PI / 2;
  midBridge.position.set(0, 0.04, 0.48);
  root.add(midBridge);

  // Temple arms
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.022, 0.7), goldMat);
    arm.position.set(side * 0.51, 0.05, 0.12);
    root.add(arm);
  });

  return root;
}

export class ThreeFaceFilterEngine {
  public readonly canvas: HTMLCanvasElement;
  public readonly isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envTexture: THREE.Texture | null = null;
  private groups: Record<string, THREE.Group> = {};
  private materials: THREE.Material[] = [];
  private currentFilterId = 'none';
  private smoothPos = new THREE.Vector3(0, 0, 0);
  private smoothRot = new THREE.Vector3(0, 0, 0);
  private smoothScale = 1.0;
  private hasSmoothedPose = false;
  private width = 720;
  private height = 960;
  private disposed = false;

  constructor(width = 720, height = 960) {
    this.width = width;
    this.height = height;
    this.isSoftwareGl = detectSoftwareGl();

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !this.isSoftwareGl,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);

    this.scene = new THREE.Scene();

    const fov = 40;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    // Mandatory studio environment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    // 3-point warm/cool studio light rig
    const hemiLight = new THREE.HemisphereLight(0xcce7ff, 0x3b2a4a, 1.15);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(3, 5, 8);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.35);
    rimLight.position.set(-4, 2, -3);
    this.scene.add(rimLight);

    // Build shared PBR materials
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      metalness: 0.94,
      roughness: 0.18,
      clearcoat: 0.4,
    });
    const darkGoldMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.88,
      roughness: 0.38,
    });
    const silverMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.5,
    });
    const obsidianMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.25,
      roughness: 0.45,
      clearcoat: 0.7,
    });
    const rubyMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x4c0519,
      emissiveIntensity: 0.35,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    });
    const sapphireMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x082f49,
      emissiveIntensity: 0.4,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    });
    const emeraldMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x022c22,
      emissiveIntensity: 0.35,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    });
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      metalness: 0.8,
      roughness: 0.2,
    });
    const skyGlowMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      metalness: 0.55,
      roughness: 0.22,
      clearcoat: 0.9,
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.4,
      metalness: 0.3,
      roughness: 0.2,
    });
    const neonMagentaMat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xc026d3,
      emissiveIntensity: 1.3,
      metalness: 0.3,
      roughness: 0.2,
    });
    const visorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x082f49,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.22,
      metalness: 0.2,
      roughness: 0.06,
      transparent: true,
      opacity: 0.62,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });
    const darkLensMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.35,
      roughness: 0.06,
      transparent: true,
      opacity: 0.82,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });
    const crimsonMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0x881337,
      emissiveIntensity: 0.35,
      metalness: 0.25,
      roughness: 0.16,
      clearcoat: 0.9,
    });
    const roseGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xfda4af,
      metalness: 0.88,
      roughness: 0.2,
      clearcoat: 0.5,
    });
    const pinkPearlMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbcfe8,
      metalness: 0.15,
      roughness: 0.22,
      clearcoat: 0.85,
    });

    this.materials = [
      goldMat,
      darkGoldMat,
      silverMat,
      obsidianMat,
      rubyMat,
      sapphireMat,
      emeraldMat,
      haloMat,
      skyGlowMat,
      neonCyanMat,
      neonMagentaMat,
      visorGlassMat,
      darkLensMat,
      crimsonMat,
      roseGoldMat,
      pinkPearlMat,
    ];

    this.groups = {
      crown_3d_royal: buildRoyalCrownGroup(
        goldMat,
        darkGoldMat,
        rubyMat,
        sapphireMat,
        emeraldMat,
        haloMat
      ),
      pidgex_wings_3d: buildPidgeXCelestialGroup(goldMat, skyGlowMat, silverMat, sapphireMat),
      cyber_visor_3d: buildCyberVisorGroup(
        silverMat,
        obsidianMat,
        neonCyanMat,
        neonMagentaMat,
        visorGlassMat
      ),
      hearts_3d_orbit: buildHeartsOrbitGroup(crimsonMat, roseGoldMat, pinkPearlMat),
      masquerade_3d: buildMasqueradeGroup(obsidianMat, goldMat, sapphireMat, pinkPearlMat),
      sunglasses_3d: buildAviatorGlassesGroup(goldMat, darkLensMat),
    };

    Object.values(this.groups).forEach((grp) => {
      grp.visible = false;
      this.scene.add(grp);
    });

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  resize(width: number, height: number) {
    if (this.disposed || width <= 0 || height <= 0) return;
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  renderFilter(
    filterId: string,
    face: FaceTrackingFrame,
    dt: number,
    elapsedSec: number
  ): boolean {
    if (this.disposed) return false;

    const activeGroup = this.groups[filterId];
    if (!activeGroup) {
      if (this.currentFilterId !== 'none') {
        Object.values(this.groups).forEach((g) => (g.visible = false));
        this.renderer.clear();
        this.currentFilterId = 'none';
      }
      return false;
    }

    if (this.currentFilterId !== filterId) {
      Object.entries(this.groups).forEach(([id, grp]) => {
        grp.visible = id === filterId;
      });
      this.currentFilterId = filterId;
    }

    if (!face.detected) {
      activeGroup.visible = false;
      this.hasSmoothedPose = false;
      this.renderer.clear();
      return false;
    }

    activeGroup.visible = true;

    const frustumHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const frustumWidth = frustumHeight * this.camera.aspect;

    const anchorType = activeGroup.userData.anchor as 'forehead' | 'eyes' | undefined;
    let normX = face.noseBridge.x;
    let normY = face.noseBridge.y;

    if (anchorType === 'forehead') {
      normX = face.foreheadTop.x;
      normY = face.foreheadTop.y - face.faceHeight * 0.04;
    } else if (anchorType === 'eyes') {
      normX = (face.leftEye.x + face.rightEye.x) * 0.5;
      normY = (face.leftEye.y + face.rightEye.y) * 0.5;
    }

    _targetPos.set((normX - 0.5) * frustumWidth, (0.5 - normY) * frustumHeight, 0);

    // Calibrated world scale proportional to face width
    const targetScale = face.faceWidth * frustumWidth * 0.98;

    // MediaPipe roll, yaw, pitch mapped cleanly to Three.js rotation
    _targetEuler.set(-face.pitch * 0.85, face.yaw * 0.95, -face.roll);

    const lambda = Math.min(28, 18);
    if (!this.hasSmoothedPose) {
      this.smoothPos.copy(_targetPos);
      this.smoothRot.set(_targetEuler.x, _targetEuler.y, _targetEuler.z);
      this.smoothScale = targetScale;
      this.hasSmoothedPose = true;
    } else {
      const clampedDt = Math.min(0.05, Math.max(0.001, dt));
      this.smoothPos.x = THREE.MathUtils.damp(this.smoothPos.x, _targetPos.x, lambda, clampedDt);
      this.smoothPos.y = THREE.MathUtils.damp(this.smoothPos.y, _targetPos.y, lambda, clampedDt);
      this.smoothRot.x = THREE.MathUtils.damp(this.smoothRot.x, _targetEuler.x, lambda, clampedDt);
      this.smoothRot.y = THREE.MathUtils.damp(this.smoothRot.y, _targetEuler.y, lambda, clampedDt);
      this.smoothRot.z = THREE.MathUtils.damp(this.smoothRot.z, _targetEuler.z, lambda, clampedDt);
      this.smoothScale = THREE.MathUtils.damp(this.smoothScale, targetScale, lambda, clampedDt);
    }

    activeGroup.position.copy(this.smoothPos);
    activeGroup.rotation.set(this.smoothRot.x, this.smoothRot.y, this.smoothRot.z);
    activeGroup.scale.setScalar(this.smoothScale);

    // Per-filter real-time 3D animations
    if (filterId === 'crown_3d_royal') {
      const halo = activeGroup.getObjectByName('animatedHalo');
      if (halo) {
        halo.rotation.y = elapsedSec * 1.4;
        halo.position.y = 0.62 + Math.sin(elapsedSec * 2.5) * 0.035;
      }
    } else if (filterId === 'pidgex_wings_3d') {
      const flap = Math.sin(elapsedSec * 3.4) * 0.16;
      const leftWing = activeGroup.getObjectByName('leftWing');
      const rightWing = activeGroup.getObjectByName('rightWing');
      if (leftWing) leftWing.rotation.z = flap;
      if (rightWing) rightWing.rotation.z = -flap;
      const aura = activeGroup.getObjectByName('animatedAura');
      if (aura) {
        aura.rotation.y = elapsedSec * 1.1;
      }
    } else if (filterId === 'cyber_visor_3d') {
      const holo = activeGroup.getObjectByName('holoScanner');
      if (holo) {
        holo.rotation.z = elapsedSec * 2.2;
      }
    } else if (filterId === 'hearts_3d_orbit') {
      const orbit = activeGroup.getObjectByName('heartsOrbit');
      if (orbit) {
        orbit.rotation.y = elapsedSec * 1.25;
        const smileBoost = 1 + face.smile * 0.38;
        orbit.children.forEach((child, idx) => {
          child.rotation.y = -orbit.rotation.y + Math.sin(elapsedSec * 2 + idx) * 0.35;
          const baseSc = idx % 2 === 0 ? 1.0 : 0.76;
          child.scale.setScalar(baseSc * smileBoost);
        });
      }
    } else if (filterId === 'masquerade_3d') {
      const dust = activeGroup.getObjectByName('goldDust');
      if (dust) {
        dust.rotation.y = elapsedSec * 0.9;
        dust.position.y = Math.sin(elapsedSec * 2.2) * 0.03;
      }
    }

    this.renderer.render(this.scene, this.camera);
    return true;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).geometry?.dispose();
      }
    });
    this.materials.forEach((m) => m.dispose());
    this.envTexture?.dispose();
    this.renderer.dispose();
  }
}
