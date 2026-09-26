import { Chat, ChatCategory } from '../types';
import { createSvgAvatar } from '../utils/avatarUtils';

export interface PotentialAcquaintance {
  id: string;
  name: string;
  username: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  category: ChatCategory;
  // Names of friends who are connected to this person
  friendOf: string[];
}

export const POTENTIAL_ACQUAINTANCES: PotentialAcquaintance[] = [
  {
    id: 'pot_sofia',
    name: 'Sofía Méndez',
    username: '@sofiamendez',
    phone: '16 688 234 567',
    bio: 'Diseñadora de interfaces & Artista 3D 🎨',
    avatarUrl: createSvgAvatar('S', '#0284c7'),
    category: 'friends',
    friendOf: ['David Silva', 'Mateo Morales'],
  },
  {
    id: 'pot_camilo',
    name: 'Camilo Navarro',
    username: '@camilonavarro',
    phone: '16 611 998 877',
    bio: 'Productor de audio & Sound designer 🎧🎶',
    avatarUrl: createSvgAvatar('C', '#2563eb'),
    category: 'friends',
    friendOf: ['David Silva', 'Lucía Ramos', 'Lucas'],
  },
  {
    id: 'pot_estela',
    name: 'Estela Vega',
    username: '@estelavega',
    phone: '16 55 8877 6655',
    bio: 'Ingeniera Frontend & Amante de los videojuegos 🕹️',
    avatarUrl: createSvgAvatar('E', '#7c3aed'),
    category: 'work',
    friendOf: ['Mateo Morales', 'Valentina Ríos', 'Sofia'],
  },
  {
    id: 'pot_lucas',
    name: 'Lucas Bennett',
    username: '@lucasb',
    phone: '16 655 443 322',
    bio: 'Fotógrafo urbano y creador audiovisual 📸⚡',
    avatarUrl: createSvgAvatar('L', '#0d9488'),
    category: 'favorites',
    friendOf: ['Lucía Ramos', 'David Silva'],
  },
  {
    id: 'pot_mariana',
    name: 'Mariana Costa',
    username: '@marianacosta',
    phone: '16 11 4455 6677',
    bio: 'Ilustradora digital & Animadora 2D ✏️✨',
    avatarUrl: createSvgAvatar('M', '#db2777'),
    category: 'friends',
    friendOf: ['Valentina Ríos', 'Lucía Ramos'],
  },
  {
    id: 'pot_gabriel',
    name: 'Gabriel Morales',
    username: '@gabomorales',
    phone: '16 55 9988 1122',
    bio: 'Desarrollador Full-Stack & Café de especialidad ☕💻',
    avatarUrl: createSvgAvatar('G', '#4f46e5'),
    category: 'work',
    friendOf: ['Mateo Morales', 'David Silva'],
  },
  {
    id: 'pot_clara',
    name: 'Clara Gómez',
    username: '@claragomez',
    phone: '16 622 334 455',
    bio: 'Arquitecta & Modelado 3D 🏛️📐',
    avatarUrl: createSvgAvatar('C', '#059669'),
    category: 'friends',
    friendOf: ['David Silva', 'Lucía Ramos'],
  },
  {
    id: 'pot_daniel',
    name: 'Daniel Herrera',
    username: '@danielherrera',
    phone: '16 11 9900 1122',
    bio: 'Compositor & Guitarrista 🎸',
    avatarUrl: createSvgAvatar('D', '#ea580c'),
    category: 'favorites',
    friendOf: ['Valentina Ríos'],
  },
  {
    id: 'pot_andres',
    name: 'Andrés Castro',
    username: '@andrescastro',
    phone: '16 55 3322 1100',
    bio: 'Especialista en Seguridad & Redes 🔒⚡',
    avatarUrl: createSvgAvatar('A', '#16a34a'),
    category: 'work',
    friendOf: ['Mateo Morales'],
  },
  {
    id: 'pot_paula',
    name: 'Paula Giménez',
    username: '@paulagimenez',
    phone: '16 633 778 899',
    bio: 'Community Manager & Redactora Creativa 📝',
    avatarUrl: createSvgAvatar('P', '#9333ea'),
    category: 'friends',
    friendOf: ['Lucía Ramos'],
  },
];

export interface MutualFriendInfo {
  friend: PotentialAcquaintance;
  mutualFriends: Chat[]; // Actual Chat objects in user's friends list
}

/**
 * Returns only the potential acquaintances that have AT LEAST ONE mutual friend
 * with the user's current chats/friends list, and who are not already added.
 */
export function getEligiblePotentialAcquaintances(
  currentChats: Chat[],
  dismissedIds: string[] = []
): MutualFriendInfo[] {
  if (!currentChats || currentChats.length === 0) {
    return [];
  }

  // Filter out contacts that are already in chats or dismissed
  const activeChatNames = currentChats.map((c) => c.name.toLowerCase().trim());
  const activeChatUsernames = currentChats
    .map((c) => c.username?.toLowerCase().trim())
    .filter(Boolean);

  const results: MutualFriendInfo[] = [];

  for (const candidate of POTENTIAL_ACQUAINTANCES) {
    if (dismissedIds.includes(candidate.id)) continue;

    // Check if candidate is already in direct chats
    const isAlreadyFriend =
      activeChatNames.includes(candidate.name.toLowerCase().trim()) ||
      (candidate.username &&
        activeChatUsernames.includes(candidate.username.toLowerCase().trim()));

    if (isAlreadyFriend) continue;

    // Find which friends of the user are connected to this candidate
    const mutualChats: Chat[] = [];

    for (const chat of currentChats) {
      const chatNameLower = chat.name.toLowerCase().trim();
      
      const isMutual = candidate.friendOf.some((friendName) => {
        const fnLower = friendName.toLowerCase().trim();
        return (
          chatNameLower.includes(fnLower) ||
          fnLower.includes(chatNameLower) ||
          chat.id.toLowerCase().includes(fnLower)
        );
      });

      if (isMutual && !mutualChats.some((m) => m.id === chat.id)) {
        mutualChats.push(chat);
      }
    }

    // STRICT RULE: Only appear if they are friends of user's friends (mutualChats > 0)
    if (mutualChats.length > 0) {
      results.push({
        friend: candidate,
        mutualFriends: mutualChats,
      });
    }
  }

  return results;
}
