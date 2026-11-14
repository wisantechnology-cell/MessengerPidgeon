import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  X,
  Box,
  Sparkles,
  Sun,
  Music,
  VolumeX,
  Share2,
  Plus,
  Trash2,
  Move,
  Heart,
  Smile,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Chat,
  DigitalAvatarConfig,
  UserProfile,
  VirtualRoomConfig,
  VirtualRoomFurniture,
} from '../types';
import { realtimeClient } from '../services/realtimeClient';
import { DEFAULT_DIGITAL_AVATAR } from '../utils/avatarRenderer';

interface VirtualRoom3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  user: UserProfile;
  onSaveRoomConfig: (chatId: string, config: VirtualRoomConfig) => void;
  onShareInviteToChat: (title: string) => void;
}

interface ParticipantAvatar3D {
  id: string;
  name: string;
  x: number;
  z: number;
  emote: 'idle' | 'wave' | 'dance' | 'love' | 'jump';
  emoteUntil?: number;
  avatarConfig?: DigitalAvatarConfig;
}

const DEFAULT_ROOM_CONFIG: VirtualRoomConfig = {
  theme: 'futuristic_lounge',
  ambientLight: '#38bdf8',
  musicMode: 'off',
  furniture: [
    { id: 'f_sofa', kind: 'sofa', x: 0, z: -2.2, rotation: 0, color: '#0284c7' },
    { id: 'f_table', kind: 'table', x: 0, z: -0.6, rotation: 0, color: '#38bdf8' },
    { id: 'f_lamp', kind: 'lamp', x: -2.5, z: -2.2, rotation: 0, color: '#fbbf24' },
    { id: 'f_plant', kind: 'plant', x: 2.5, z: -2.2, rotation: 0, color: '#10b981' },
    { id: 'f_screen', kind: 'screen', x: 0, z: -3.5, rotation: 0, color: '#6366f1' },
  ],
};

const ROOM_THEME_SPECS: Record<
  VirtualRoomConfig['theme'],
  { label: string; floor: number; wall: number; bg: number; grid: number; fog: number }
> = {
  futuristic_lounge: {
    label: 'Lounge Futurista',
    floor: 0x0f172a,
    wall: 0x162036,
    bg: 0x080d1a,
    grid: 0x0ea5e9,
    fog: 0x080d1a,
  },
  cozy_cabin: {
    label: 'Estudio Cálido',
    floor: 0x2b1d14,
    wall: 0x3b271c,
    bg: 0x1a110b,
    grid: 0xd97706,
    fog: 0x1a110b,
  },
  neon_terrace: {
    label: 'Terraza Neón',
    floor: 0x160d26,
    wall: 0x21113b,
    bg: 0x0d0717,
    grid: 0xec4899,
    fog: 0x0d0717,
  },
  space_studio: {
    label: 'Estación Orbital',
    floor: 0x0b1220,
    wall: 0x0f192d,
    bg: 0x030712,
    grid: 0x6366f1,
    fog: 0x030712,
  },
};

function buildCompositeFurnitureMesh(item: VirtualRoomFurniture): THREE.Group {
  const group = new THREE.Group();
  const baseColor = new THREE.Color(item.color || '#38bdf8');
  const mainMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.35,
    metalness: 0.25,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.7,
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.2),
    roughness: 0.7,
  });

  if (item.kind === 'sofa') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.0), mainMat);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 0.22), mainMat);
    back.position.set(0, 0.65, -0.39);
    back.castShadow = true;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 1.0), mainMat);
    armL.position.set(-1.1, 0.45, 0);
    const armR = armL.clone();
    armR.position.x = 1.1;
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.65), cushionMat);
    c1.position.set(-0.5, 0.48, 0.04);
    const c2 = c1.clone();
    c2.position.x = 0.5;
    for (const [lx, lz] of [
      [-1.05, -0.4],
      [1.05, -0.4],
      [-1.05, 0.4],
      [1.05, 0.4],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.12, 8), darkMetal);
      leg.position.set(lx, 0.06, lz);
      group.add(leg);
    }
    group.add(base, back, armL, armR, c1, c2);
  } else if (item.kind === 'table') {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.55,
      transparent: true,
      opacity: 0.85,
    });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.06, 28), glassMat);
    top.position.y = 0.46;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.025, 10, 32),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.7,
      })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.46;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.42, 16), darkMetal);
    stem.position.y = 0.22;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.05, 24), darkMetal);
    foot.position.y = 0.025;
    // Small holo crystal on table
    const holo = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.9,
      })
    );
    holo.position.y = 0.64;
    holo.name = 'holo_spin';
    group.add(top, rim, stem, foot, holo);
  } else if (item.kind === 'lamp') {
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 18), darkMetal);
    standBase.position.y = 0.03;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.55, 12), darkMetal);
    pole.position.y = 0.8;
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.34, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    shade.position.y = 1.6;
    const bulb = new THREE.PointLight(baseColor, 2.2, 5.5);
    bulb.position.y = 1.5;
    group.add(standBase, pole, shade, bulb);
  } else if (item.kind === 'plant') {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.18, 0.38, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
    );
    pot.position.y = 0.19;
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x3f2718, roughness: 0.9 })
    );
    soil.position.y = 0.37;
    group.add(pot, soil);
    const leafMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 8), leafMat);
      leaf.position.set(Math.cos(ang) * 0.14, 0.62 + (i % 2) * 0.1, Math.sin(ang) * 0.14);
      leaf.rotation.z = -Math.cos(ang) * 0.45;
      leaf.rotation.x = Math.sin(ang) * 0.45;
      group.add(leaf);
    }
  } else if (item.kind === 'screen') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 0.08), darkMetal);
    frame.position.y = 1.65;
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.42, 1.18),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      })
    );
    display.position.set(0, 1.65, 0.05);
    display.name = 'cinema_screen';
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.12), darkMetal);
    bar.position.set(0, 0.92, 0);
    group.add(frame, display, bar);
  } else if (item.kind === 'disco') {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), darkMetal);
    cord.position.y = 2.6;
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.08,
        emissive: baseColor,
        emissiveIntensity: 0.35,
      })
    );
    ball.position.y = 2.2;
    ball.name = 'disco_ball';
    const light = new THREE.PointLight(baseColor, 2.6, 8);
    light.position.y = 2.05;
    group.add(cord, ball, light);
  }

  group.position.set(item.x, 0, item.z);
  group.rotation.y = item.rotation;
  return group;
}

function buildAvatarMesh(avatarCfg?: DigitalAvatarConfig, fallbackColor = '#38bdf8'): THREE.Group {
  const cfg = avatarCfg || DEFAULT_DIGITAL_AVATAR;
  const g = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skinTone || '#f1c29b', roughness: 0.6 });
  const outfitMat = new THREE.MeshStandardMaterial({
    color: cfg.outfitColor || fallbackColor,
    roughness: 0.4,
    metalness: 0.2,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: cfg.hairColor || '#1e1b18', roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

  // Torso & legs
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.34, 6, 12), darkMat);
  legL.position.set(-0.11, 0.24, 0);
  const legR = legL.clone();
  legR.position.x = 0.11;

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 8, 16), outfitMat);
  torso.position.y = 0.72;
  torso.castShadow = true;

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 6, 10), outfitMat);
  armL.position.set(-0.28, 0.74, 0);
  armL.name = 'arm_l';
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 6, 10), outfitMat);
  armR.position.set(0.28, 0.74, 0);
  armR.name = 'arm_r';

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), skinMat);
  head.position.y = 1.24;
  head.castShadow = true;

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
  eyeL.position.set(-0.075, 1.26, 0.195);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.075;

  // Hair cap
  if (cfg.hairStyle !== 'none') {
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.235, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairCap.position.y = 1.26;
    hairCap.rotation.x = -0.18;
    g.add(hairCap);
  }

  // Accessory hint
  if (cfg.accessory === 'crown') {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.14, 5),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.2 })
    );
    crown.position.y = 1.52;
    g.add(crown);
  } else if (cfg.accessory === 'halo') {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.02, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.8 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.56;
    g.add(halo);
  }

  // Aura ring at feet
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.39, 28),
    new THREE.MeshBasicMaterial({
      color: cfg.auraColor || '#38bdf8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.015;

  g.add(legL, legR, torso, armL, armR, head, eyeL, eyeR, aura);
  return g;
}

export const VirtualRoom3DModal: React.FC<VirtualRoom3DModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  onSaveRoomConfig,
  onShareInviteToChat,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [roomConfig, setRoomConfig] = useState<VirtualRoomConfig>(
    chat.virtualRoomConfig || DEFAULT_ROOM_CONFIG
  );
  const [participants, setParticipants] = useState<Record<string, ParticipantAvatar3D>>({});
  const [myPos, setMyPos] = useState<{ x: number; z: number }>({ x: -0.9, z: 1.2 });
  const [myEmote, setMyEmote] = useState<ParticipantAvatar3D['emote']>('idle');
  const [activeTab, setActiveTab] = useState<'controls' | 'decor' | 'theme'>('controls');
  const [savedNotice, setSavedNotice] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<any>(null);

  const participantsRef = useRef(participants);
  participantsRef.current = participants;
  const myPosRef = useRef(myPos);
  myPosRef.current = myPos;
  const myEmoteRef = useRef(myEmote);
  myEmoteRef.current = myEmote;
  const roomConfigRef = useRef(roomConfig);
  roomConfigRef.current = roomConfig;

  useEffect(() => {
    if (chat.virtualRoomConfig) {
      setRoomConfig(chat.virtualRoomConfig);
    }
  }, [chat.id]);

  // Seed initial participants (me + chat contact) and subscribe to real-time WS 3D room updates
  useEffect(() => {
    if (!isOpen) return;
    const baseParticipants: Record<string, ParticipantAvatar3D> = {
      [user.id]: {
        id: user.id,
        name: user.name,
        x: myPos.x,
        z: myPos.z,
        emote: myEmote,
        avatarConfig: user.digitalAvatar,
      },
      [chat.id]: {
        id: chat.id,
        name: chat.name,
        x: 1.1,
        z: 1.0,
        emote: 'idle',
        avatarConfig: {
          ...DEFAULT_DIGITAL_AVATAR,
          outfitColor: '#ec4899',
          auraColor: '#a855f7',
          hairStyle: 'long',
        },
      },
    };
    setParticipants(baseParticipants);

    realtimeClient.ensureConnected(user);
    realtimeClient.joinRoom(chat.id);
    realtimeClient.sendRoom3dUpdate(chat.id, {
      avatarState: {
        x: myPos.x,
        z: myPos.z,
        emote: myEmote,
        avatarConfig: user.digitalAvatar,
      },
    });

    const unsub = realtimeClient.subscribeRoom3d((roomId, remoteConfig, remoteAvatars) => {
      if (roomId !== chat.id) return;
      if (remoteConfig) {
        setRoomConfig(remoteConfig);
      }
      if (remoteAvatars) {
        setParticipants((prev) => {
          const next = { ...prev };
          Object.entries(remoteAvatars).forEach(([uid, st]: [string, any]) => {
            if (uid === user.id) return;
            next[uid] = {
              id: uid,
              name: st.name || 'Amigo',
              x: typeof st.x === 'number' ? st.x : 1.0,
              z: typeof st.z === 'number' ? st.z : 1.0,
              emote: st.emote || 'idle',
              avatarConfig: st.avatarConfig,
            };
          });
          return next;
        });
      }
    });

    return () => {
      unsub();
    };
  }, [isOpen, chat.id, user.id]);

  // WebAudio ambient room synthesizer
  useEffect(() => {
    clearInterval(musicTimerRef.current);
    if (!isOpen || roomConfig.musicMode === 'off') {
      return;
    }

    const playChord = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const chords: Record<string, number[][]> = {
          ambient: [
            [220, 277.18, 329.63],
            [196, 246.94, 293.66],
            [174.61, 220, 261.63],
          ],
          lofi: [
            [261.63, 311.13, 392, 466.16],
            [233.08, 277.18, 349.23, 415.3],
          ],
          synth: [
            [130.81, 261.63, 392],
            [146.83, 293.66, 440],
          ],
        };
        const list = chords[roomConfig.musicMode] || chords.ambient;
        const notes = list[Math.floor(Math.random() * list.length)];
        const now = ctx.currentTime;
        notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = roomConfig.musicMode === 'synth' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.025, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.3);
        });
      } catch {
        // ignore audio context block
      }
    };

    playChord();
    musicTimerRef.current = setInterval(playChord, 2500);
    return () => clearInterval(musicTimerRef.current);
  }, [isOpen, roomConfig.musicMode]);

  useEffect(() => {
    return () => {
      clearInterval(musicTimerRef.current);
      try {
        audioCtxRef.current?.close();
      } catch {}
    };
  }, []);

  // Three.js scene lifecycle
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 360;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setContextLost(true);
      return;
    }

    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    const isSoftwareGl = /swiftshader|llvmpipe|software/i.test(gpuStr);

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 60);
    camera.position.set(0, 3.6, 5.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 10;
    controls.target.set(0, 0.9, -0.5);

    const themeSpec = ROOM_THEME_SPECS[roomConfig.theme];
    scene.background = new THREE.Color(themeSpec.bg);
    scene.fog = new THREE.FogExp2(themeSpec.fog, 0.055);

    // Lights
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(4, 7, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
    }
    scene.add(keyLight);

    const accentPoint = new THREE.PointLight(new THREE.Color(roomConfig.ambientLight || '#38bdf8'), 3.2, 12);
    accentPoint.position.set(0, 2.8, -0.5);
    scene.add(accentPoint);

    // Floor, walls & grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.MeshStandardMaterial({ color: themeSpec.floor, roughness: 0.45, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(10, 16, themeSpec.grid, themeSpec.grid);
    grid.position.y = 0.005;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    scene.add(grid);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 4.4),
      new THREE.MeshStandardMaterial({ color: themeSpec.wall, roughness: 0.8 })
    );
    backWall.position.set(0, 2.2, -4.2);
    scene.add(backWall);

    // Neon horizon strip
    const neonStrip = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.06, 0.06),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(roomConfig.ambientLight || '#38bdf8'),
        emissive: new THREE.Color(roomConfig.ambientLight || '#38bdf8'),
        emissiveIntensity: 1.5,
      })
    );
    neonStrip.position.set(0, 3.3, -4.15);
    scene.add(neonStrip);

    // Furniture group
    const furnitureGroup = new THREE.Group();
    roomConfig.furniture.forEach((f) => {
      furnitureGroup.add(buildCompositeFurnitureMesh(f));
    });
    scene.add(furnitureGroup);

    // Participant avatars group
    const avatarMeshes = new Map<string, THREE.Group>();
    const syncAvatars = () => {
      const current = participantsRef.current;
      Object.values(current).forEach((p, idx) => {
        if (!avatarMeshes.has(p.id)) {
          const mesh = buildAvatarMesh(
            p.avatarConfig,
            p.id === user.id ? '#0284c7' : idx % 2 === 0 ? '#ec4899' : '#10b981'
          );
          mesh.position.set(p.x, 0, p.z);
          scene.add(mesh);
          avatarMeshes.set(p.id, mesh);
        }
      });
    };
    syncAvatars();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 640;
      const h = mountRef.current.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Animate spinning holos / disco ball / screen glow
      furnitureGroup.traverse((obj) => {
        if (obj.name === 'holo_spin' || obj.name === 'disco_ball') {
          obj.rotation.y = t * 1.4;
          obj.position.y += Math.sin(t * 2.5) * 0.0008;
        }
      });

      syncAvatars();
      const mapState = participantsRef.current;
      avatarMeshes.forEach((mesh, uid) => {
        const targetPos =
          uid === user.id
            ? myPosRef.current
            : mapState[uid]
            ? { x: mapState[uid].x, z: mapState[uid].z }
            : { x: 1, z: 1 };

        mesh.position.x += (targetPos.x - mesh.position.x) * 0.14;
        mesh.position.z += (targetPos.z - mesh.position.z) * 0.14;

        const emote = uid === user.id ? myEmoteRef.current : mapState[uid]?.emote || 'idle';
        const armR = mesh.getObjectByName('arm_r');
        const armL = mesh.getObjectByName('arm_l');
        if (emote === 'jump') {
          mesh.position.y = Math.abs(Math.sin(t * 7)) * 0.45;
        } else if (emote === 'dance') {
          mesh.position.y = Math.abs(Math.sin(t * 6)) * 0.12;
          mesh.rotation.y = Math.sin(t * 4) * 0.6;
        } else if (emote === 'wave') {
          mesh.position.y = 0;
          if (armR) armR.rotation.z = -2.2 + Math.sin(t * 10) * 0.45;
        } else if (emote === 'love') {
          mesh.position.y = Math.sin(t * 4) * 0.06;
          if (armL && armR) {
            armL.rotation.z = 1.1;
            armR.rotation.z = -1.1;
          }
        } else {
          mesh.position.y = Math.sin(t * 2 + (uid === user.id ? 0 : 1.5)) * 0.025;
          mesh.rotation.y *= 0.92;
          if (armR) armR.rotation.z *= 0.85;
          if (armL) armL.rotation.z *= 0.85;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      envTex.dispose();
      pmrem.dispose();
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [isOpen, roomConfig]);

  if (!isOpen) return null;

  const updateConfigAndBroadcast = (next: VirtualRoomConfig) => {
    setRoomConfig(next);
    onSaveRoomConfig(chat.id, next);
    realtimeClient.sendRoom3dUpdate(chat.id, { roomConfig: next });
    try {
      setDoc(
        doc(db, 'virtualRooms', chat.id),
        {
          chatId: chat.id,
          theme: next.theme,
          ambientLight: next.ambientLight,
          musicMode: next.musicMode,
          furniture: next.furniture,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const moveAvatar = (dx: number, dz: number) => {
    const next = {
      x: Math.max(-3.6, Math.min(3.6, Number((myPos.x + dx).toFixed(2)))),
      z: Math.max(-2.6, Math.min(3.4, Number((myPos.z + dz).toFixed(2)))),
    };
    setMyPos(next);
    realtimeClient.sendRoom3dUpdate(chat.id, {
      avatarState: { x: next.x, z: next.z, emote: myEmote, avatarConfig: user.digitalAvatar },
    });
  };

  const triggerEmote = (emote: ParticipantAvatar3D['emote']) => {
    setMyEmote(emote);
    realtimeClient.sendRoom3dUpdate(chat.id, {
      avatarState: { x: myPos.x, z: myPos.z, emote, avatarConfig: user.digitalAvatar },
    });
    if (emote !== 'idle') {
      setTimeout(() => {
        setMyEmote('idle');
        realtimeClient.sendRoom3dUpdate(chat.id, {
          avatarState: { x: myPosRef.current.x, z: myPosRef.current.z, emote: 'idle' },
        });
      }, 3200);
    }
  };

  const toggleFurnitureKind = (kind: VirtualRoomFurniture['kind']) => {
    const exists = roomConfig.furniture.find((f) => f.kind === kind);
    let nextList: VirtualRoomFurniture[];
    if (exists) {
      nextList = roomConfig.furniture.filter((f) => f.kind !== kind);
    } else {
      const defaults: Record<VirtualRoomFurniture['kind'], { x: number; z: number; color: string }> = {
        sofa: { x: 0, z: -2.2, color: '#0284c7' },
        table: { x: 0, z: -0.6, color: '#38bdf8' },
        lamp: { x: -2.5, z: -2.2, color: '#fbbf24' },
        plant: { x: 2.5, z: -2.2, color: '#10b981' },
        screen: { x: 0, z: -3.5, color: '#6366f1' },
        disco: { x: 0, z: 0, color: '#ec4899' },
      };
      const d = defaults[kind];
      nextList = [
        ...roomConfig.furniture,
        {
          id: `f_${kind}_${Date.now()}`,
          kind,
          x: d.x,
          z: d.z,
          rotation: 0,
          color: d.color,
        },
      ];
    }
    updateConfigAndBroadcast({ ...roomConfig, furniture: nextList });
  };

  const participantList = Object.values(participants);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-4xl h-full sm:h-[90vh] bg-[#0d121d] border border-white/10 sm:rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#131a29]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">Habitación Virtual 3D · {chat.name}</h3>
              <p className="text-[11px] text-slate-400">
                {participantList.length} {participantList.length === 1 ? 'avatar' : 'avatares'} en sala · Arrastra para rotar cámara
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {savedNotice && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onShareInviteToChat(`Entra a nuestra Habitación Virtual 3D (${ROOM_THEME_SPECS[roomConfig.theme].label})`);
              }}
              className="px-3 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invitar al Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="relative flex-1 min-h-[260px] bg-[#060913]">
          <div ref={mountRef} className="w-full h-full" />
          {contextLost && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#090d18] text-center p-6">
              <p className="text-sm text-slate-300">
                El contexto WebGL 3D se reinició. Cierra y vuelve a abrir la habitación para recargar la escena.
              </p>
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="border-t border-white/10 bg-[#121827] p-3.5 flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'controls', label: 'Avatares y Emotes' },
                { id: 'decor', label: 'Muebles y Objetos' },
                { id: 'theme', label: 'Ambiente y Música' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0284c7] text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateConfigAndBroadcast({
                  ...roomConfig,
                  musicMode: roomConfig.musicMode === 'off' ? 'ambient' : 'off',
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                roomConfig.musicMode !== 'off'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              {roomConfig.musicMode === 'off' ? <VolumeX className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
              <span>{roomConfig.musicMode === 'off' ? 'Música: Off' : `Música: ${roomConfig.musicMode}`}</span>
            </button>
          </div>

          {activeTab === 'controls' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Movement Pad */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" /> Mover:
                </span>
                <button
                  type="button"
                  onClick={() => moveAvatar(-0.55, 0)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label="Mover izquierda"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveAvatar(0, -0.55)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label="Mover adelante"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveAvatar(0, 0.55)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label="Mover atrás"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveAvatar(0.55, 0)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label="Mover derecha"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Emote Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'wave', label: 'Saludar', icon: <Smile className="w-3.5 h-3.5" /> },
                  { id: 'dance', label: 'Bailar', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'love', label: 'Corazón', icon: <Heart className="w-3.5 h-3.5" /> },
                  { id: 'jump', label: 'Saltar', icon: <ArrowUp className="w-3.5 h-3.5" /> },
                ].map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => triggerEmote(em.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      myEmote === em.id
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200'
                    }`}
                  >
                    {em.icon}
                    <span>{em.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'decor' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { kind: 'sofa', label: 'Sofá' },
                { kind: 'table', label: 'Mesa Holo' },
                { kind: 'lamp', label: 'Lámpara' },
                { kind: 'plant', label: 'Planta' },
                { kind: 'screen', label: 'Pantalla' },
                { kind: 'disco', label: 'Esfera Disco' },
              ].map((item) => {
                const active = roomConfig.furniture.some((f) => f.kind === item.kind);
                return (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => toggleFurnitureKind(item.kind as any)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {active ? <Trash2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(ROOM_THEME_SPECS).map(([id, spec]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateConfigAndBroadcast({ ...roomConfig, theme: id as any })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      roomConfig.theme === id
                        ? 'bg-[#0284c7] border-sky-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300">Luz:</span>
                {['#38bdf8', '#ec4899', '#a855f7', '#10b981', '#f59e0b'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateConfigAndBroadcast({ ...roomConfig, ambientLight: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full cursor-pointer border-2 ${
                      roomConfig.ambientLight === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
