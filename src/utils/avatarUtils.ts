/**
 * Helpers and default SVG avatars for MessengerPidgeon
 * Clean, modern, vector-based avatars with no external human stock photos.
 */

export function createSvgAvatar(seed: string, bgColor: string = '#2563eb', textColor: string = '#ffffff'): string {
  const initial = (seed || 'U').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${initial}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#g_${initial})"/>
    <text x="50" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Stylized messenger pigeon avatar for default profile
export const DEFAULT_PIDGEON_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bgP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="birdP" x1="20%" y1="20%" x2="80%" y2="80%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#bgP)"/>
  <circle cx="50" cy="50" r="48" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.6"/>
  <!-- Pigeon silhouette -->
  <path d="M 30 42 C 26 43, 20 48, 18 51 C 21 52, 26 53, 30 52 C 32 48, 35 43, 39 39 C 44 34, 52 34, 58 38 C 66 43, 71 52, 78 59 C 85 66, 91 67, 95 64 C 90 72, 80 77, 69 76 C 56 75, 47 67, 39 59 C 33 51, 31 45, 30 42 Z" fill="url(#birdP)"/>
  <path d="M 35 39 C 32 35, 27 36, 23 39 C 18 42, 16 44, 13 46 C 17 47, 21 47, 25 45 C 27 47, 31 49, 35 46 C 37 44, 38 41, 35 39 Z" fill="url(#birdP)"/>
  <circle cx="28" cy="41" r="2.5" fill="#0369a1"/>
  <!-- Wing -->
  <path d="M 48 39 C 55 33, 67 27, 80 28 C 84 28, 88 32, 88 37 C 88 45, 80 54, 70 61 C 61 67, 54 65, 50 57 C 48 52, 47 45, 48 39 Z" fill="#bae6fd"/>
  <!-- Little heart in envelope -->
  <g transform="translate(68, 62)">
    <rect x="0" y="0" width="22" height="15" rx="3" fill="#ffffff" stroke="#0284c7" stroke-width="1.8"/>
    <path d="M 1 1 L 11 9 L 21 1" stroke="#0284c7" stroke-width="1.8" fill="none"/>
    <circle cx="11" cy="10" r="2" fill="#38bdf8"/>
  </g>
</svg>`)}`;

export const PRESET_AVATARS = [
  {
    id: 'pigeon',
    name: 'Paloma Mensajera (Predeterminado)',
    url: DEFAULT_PIDGEON_AVATAR,
  },
  {
    id: 'user_blue',
    name: 'Avatar Azul Clásico',
    url: createSvgAvatar('P', '#0284c7'),
  },
  {
    id: 'user_emerald',
    name: 'Avatar Esmeralda',
    url: createSvgAvatar('M', '#059669'),
  },
  {
    id: 'user_purple',
    name: 'Avatar Púrpura',
    url: createSvgAvatar('A', '#7c3aed'),
  },
  {
    id: 'user_amber',
    name: 'Avatar Dorado',
    url: createSvgAvatar('C', '#d97706'),
  },
  {
    id: 'user_rose',
    name: 'Avatar Carmesí',
    url: createSvgAvatar('E', '#e11d48'),
  },
];
