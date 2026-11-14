export type FilterCategory = 'all' | '3d' | 'exclusive' | 'animated' | 'beauty' | 'color';

export type FilterEngineType = 'none' | '3d' | '2d-ar' | 'beauty' | 'color';

export interface CameraFilterDef {
  id: string;
  name: string;
  shortName: string;
  category: Exclude<FilterCategory, 'all'>;
  engine: FilterEngineType;
  badge?: '3D' | 'VIP' | 'ANIM' | 'PRO';
  is3D?: boolean;
  isExclusive?: boolean;
  isAnimated?: boolean;
  supportsBeautySlider?: boolean;
  interactiveHint?: string;
  swatchGradient: string;
  accentColor: string;
  iconKey:
    | 'none'
    | 'crown'
    | 'wings'
    | 'visor'
    | 'mask'
    | 'glasses'
    | 'hearts'
    | 'dog'
    | 'cat'
    | 'butterfly'
    | 'makeup'
    | 'beauty'
    | 'porcelain'
    | 'vintage'
    | 'noir'
    | 'golden'
    | 'neon';
  canvasFilterCss?: string;
  vignetteStrength?: number;
  grainAmount?: number;
  warmOverlay?: string;
  beautyStrength?: number;
}

export const FILTER_CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: '3d', label: '3D' },
  { id: 'exclusive', label: 'Exclusivos' },
  { id: 'animated', label: 'Animados' },
  { id: 'beauty', label: 'Belleza' },
  { id: 'color', label: 'Color' },
];

export const CAMERA_FILTERS: CameraFilterDef[] = [
  {
    id: 'none',
    name: 'Normal',
    shortName: 'Normal',
    category: 'color',
    engine: 'none',
    swatchGradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    accentColor: '#94a3b8',
    iconKey: 'none',
  },
  // --- 3D & EXCLUSIVOS ---
  {
    id: 'crown_3d_royal',
    name: 'Corona Real 3D',
    shortName: 'Corona 3D',
    category: '3d',
    engine: '3d',
    badge: '3D',
    is3D: true,
    isExclusive: true,
    isAnimated: true,
    swatchGradient: 'linear-gradient(135deg, #fbbf24 0%, #b45309 55%, #78350f 100%)',
    accentColor: '#fbbf24',
    iconKey: 'crown',
    beautyStrength: 0.25,
    canvasFilterCss: 'contrast(1.04) saturate(1.08)',
  },
  {
    id: 'pidgex_wings_3d',
    name: 'PidgeX Celestial 3D',
    shortName: 'PidgeX VIP',
    category: 'exclusive',
    engine: '3d',
    badge: 'VIP',
    is3D: true,
    isExclusive: true,
    isAnimated: true,
    swatchGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #fbbf24 100%)',
    accentColor: '#38bdf8',
    iconKey: 'wings',
    beautyStrength: 0.3,
    canvasFilterCss: 'brightness(1.05) contrast(1.06) saturate(1.12)',
  },
  {
    id: 'cyber_visor_3d',
    name: 'Visor Cyber 3D',
    shortName: 'Cyber 3D',
    category: '3d',
    engine: '3d',
    badge: '3D',
    is3D: true,
    isAnimated: true,
    swatchGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #a855f7 100%)',
    accentColor: '#22d3ee',
    iconKey: 'visor',
    canvasFilterCss: 'contrast(1.12) saturate(1.2)',
    vignetteStrength: 0.28,
  },
  {
    id: 'hearts_3d_orbit',
    name: 'Corazones 3D',
    shortName: 'Corazones',
    category: 'animated',
    engine: '3d',
    badge: 'ANIM',
    is3D: true,
    isAnimated: true,
    interactiveHint: 'Sonríe para liberar corazones',
    swatchGradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 55%, #be123c 100%)',
    accentColor: '#fb7185',
    iconKey: 'hearts',
    beautyStrength: 0.35,
    canvasFilterCss: 'brightness(1.04) saturate(1.1)',
  },
  {
    id: 'masquerade_3d',
    name: 'Máscara Veneciana 3D',
    shortName: 'Máscara 3D',
    category: 'exclusive',
    engine: '3d',
    badge: 'VIP',
    is3D: true,
    isExclusive: true,
    isAnimated: true,
    swatchGradient: 'linear-gradient(135deg, #1e1b4b 0%, #d97706 60%, #fef08a 100%)',
    accentColor: '#f59e0b',
    iconKey: 'mask',
    canvasFilterCss: 'contrast(1.08) saturate(1.05)',
    vignetteStrength: 0.25,
  },
  {
    id: 'sunglasses_3d',
    name: 'Lentes Aviador 3D',
    shortName: 'Lentes 3D',
    category: '3d',
    engine: '3d',
    badge: '3D',
    is3D: true,
    swatchGradient: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 80%, #fef3c7 100%)',
    accentColor: '#f59e0b',
    iconKey: 'glasses',
    canvasFilterCss: 'contrast(1.06) saturate(1.08)',
  },
  // --- 2D AR & ANIMADOS ---
  {
    id: 'dog_ar',
    name: 'Perrito Juguetón',
    shortName: 'Perrito',
    category: 'animated',
    engine: '2d-ar',
    badge: 'ANIM',
    isAnimated: true,
    interactiveHint: 'Abre la boca para sacar la lengua',
    swatchGradient: 'linear-gradient(135deg, #d97706 0%, #92400e 60%, #fde68a 100%)',
    accentColor: '#f59e0b',
    iconKey: 'dog',
    beautyStrength: 0.2,
    canvasFilterCss: 'brightness(1.04) saturate(1.06)',
  },
  {
    id: 'cat_ar',
    name: 'Gatito Kawaii',
    shortName: 'Gatito',
    category: 'animated',
    engine: '2d-ar',
    badge: 'ANIM',
    isAnimated: true,
    swatchGradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 55%, #fbcfe8 100%)',
    accentColor: '#f472b6',
    iconKey: 'cat',
    beautyStrength: 0.3,
    canvasFilterCss: 'brightness(1.05) saturate(1.08)',
  },
  {
    id: 'butterfly_anim',
    name: 'Mariposas Mágicas',
    shortName: 'Mariposas',
    category: 'animated',
    engine: '2d-ar',
    badge: 'ANIM',
    isAnimated: true,
    interactiveHint: 'Sonríe para ver destellos dorados',
    swatchGradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 55%, #f0abfc 100%)',
    accentColor: '#818cf8',
    iconKey: 'butterfly',
    beautyStrength: 0.35,
    canvasFilterCss: 'brightness(1.06) saturate(1.12)',
    warmOverlay: 'rgba(244, 114, 182, 0.06)',
  },
  {
    id: 'makeup_glam',
    name: 'Glam Estudio',
    shortName: 'Maquillaje',
    category: 'beauty',
    engine: '2d-ar',
    badge: 'PRO',
    supportsBeautySlider: true,
    swatchGradient: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #fda4af 100%)',
    accentColor: '#fb7185',
    iconKey: 'makeup',
    beautyStrength: 0.55,
    canvasFilterCss: 'brightness(1.06) contrast(1.03) saturate(1.08)',
  },
  // --- BELLEZA ---
  {
    id: 'beauty_natural',
    name: 'Belleza Natural',
    shortName: 'Natural',
    category: 'beauty',
    engine: 'beauty',
    supportsBeautySlider: true,
    swatchGradient: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 60%, #fecdd3 100%)',
    accentColor: '#fda4af',
    iconKey: 'beauty',
    beautyStrength: 0.55,
    canvasFilterCss: 'brightness(1.07) contrast(1.02) saturate(1.05)',
    warmOverlay: 'rgba(255, 224, 196, 0.08)',
  },
  {
    id: 'beauty_porcelain',
    name: 'Piel de Porcelana',
    shortName: 'Porcelana',
    category: 'beauty',
    engine: 'beauty',
    badge: 'PRO',
    supportsBeautySlider: true,
    swatchGradient: 'linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 60%, #e0f2fe 100%)',
    accentColor: '#e879f9',
    iconKey: 'porcelain',
    beautyStrength: 0.8,
    canvasFilterCss: 'brightness(1.1) contrast(0.98) saturate(0.96)',
    warmOverlay: 'rgba(255, 240, 248, 0.08)',
  },
  // --- COLOR & ESTÉTICOS ---
  {
    id: 'golden_hour',
    name: 'Hora Dorada',
    shortName: 'Dorado',
    category: 'color',
    engine: 'color',
    swatchGradient: 'linear-gradient(135deg, #fb923c 0%, #f59e0b 55%, #fde047 100%)',
    accentColor: '#fb923c',
    iconKey: 'golden',
    canvasFilterCss: 'sepia(0.24) brightness(1.06) contrast(1.08) saturate(1.28)',
    warmOverlay: 'rgba(251, 146, 60, 0.14)',
    vignetteStrength: 0.22,
  },
  {
    id: 'vintage_film',
    name: 'Vintage 90s',
    shortName: 'Vintage',
    category: 'color',
    engine: 'color',
    swatchGradient: 'linear-gradient(135deg, #a16207 0%, #78350f 60%, #451a03 100%)',
    accentColor: '#d97706',
    iconKey: 'vintage',
    canvasFilterCss: 'sepia(0.45) contrast(1.08) brightness(0.97) saturate(0.86)',
    warmOverlay: 'rgba(180, 120, 60, 0.12)',
    vignetteStrength: 0.36,
    grainAmount: 0.07,
  },
  {
    id: 'noir_bw',
    name: 'Blanco y Negro',
    shortName: 'Noir B&N',
    category: 'color',
    engine: 'color',
    swatchGradient: 'linear-gradient(135deg, #f8fafc 0%, #64748b 50%, #0f172a 100%)',
    accentColor: '#e2e8f0',
    iconKey: 'noir',
    canvasFilterCss: 'grayscale(1) contrast(1.24) brightness(1.02)',
    vignetteStrength: 0.38,
    grainAmount: 0.04,
  },
  {
    id: 'cyber_pop',
    name: 'Neón Estético',
    shortName: 'Neón',
    category: 'color',
    engine: 'color',
    swatchGradient: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #ec4899 100%)',
    accentColor: '#22d3ee',
    iconKey: 'neon',
    canvasFilterCss: 'contrast(1.18) saturate(1.38) brightness(1.03) hue-rotate(-6deg)',
    warmOverlay: 'rgba(99, 102, 241, 0.12)',
    vignetteStrength: 0.3,
  },
];

export function getFilterById(id: string): CameraFilterDef {
  return CAMERA_FILTERS.find((f) => f.id === id) || CAMERA_FILTERS[0];
}
