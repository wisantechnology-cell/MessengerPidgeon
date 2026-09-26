import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "MessengerPidgeon",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY")
  });
});

// Helper for contextual fallback responses for each contact persona
function generateFallbackReply(
  contactName: string,
  userMessage: string,
  senderName: string
): string {
  const msgLower = (userMessage || "").toLowerCase().trim();

  // Handle photo/lens mentions
  if (msgLower.includes("foto") || msgLower.includes("lente") || msgLower.includes("snap") || msgLower.includes("perrito") || msgLower.includes("gatito")) {
    return `¡Jajaja qué genial esa foto con el lente! Te quedó súper bien 📸✨`;
  }

  // Handle voice notes
  if (msgLower.includes("nota de voz") || msgLower.includes("audio")) {
    return `¡Recibí tu nota de voz! Qué bueno escucharte, cuenta conmigo al 100% 🎙️🙌`;
  }

  // Handle stickers
  if (msgLower.includes("sticker")) {
    return `¡Jajaja me encantó ese sticker! 🌟👌`;
  }

  // Handle questions
  if (msgLower.endsWith("?") || msgLower.includes("cómo") || msgLower.includes("como") || msgLower.includes("qué") || msgLower.includes("que") || msgLower.includes("dónde") || msgLower.includes("cuándo") || msgLower.includes("por qué") || msgLower.includes("quién")) {
    if (msgLower.includes("cómo estás") || msgLower.includes("como estas") || msgLower.includes("que tal") || msgLower.includes("qué tal")) {
      return `¡Todo súper bien por acá ${senderName}! Con mucha energía hoy. ¿Y tú cómo vas? 😊`;
    }
    if (msgLower.includes("haces") || msgLower.includes("haciendo")) {
      return `Aquí avanzando unos pendientes de la semana y revisando mensajes. ¿Tú en qué andas? 🚀`;
    }
    if (msgLower.includes("hora") || msgLower.includes("cuándo") || msgLower.includes("cuando") || msgLower.includes("tiempo")) {
      return `¡Por mí perfecto! Me acomodo a tu horario cuando tú me digas ⏰👍`;
    }
    if (msgLower.includes("dónde") || msgLower.includes("donde")) {
      return `Estoy conectado desde la app en mi escritorio. ¿Dónde andas tú? 📍`;
    }
    return `¡Buena pregunta! Respecto a "${userMessage}", creo que es una excelente idea y podemos coordinarlo justo como dices 💡`;
  }

  // Handle greetings
  if (msgLower.startsWith("hola") || msgLower.startsWith("buenas") || msgLower.startsWith("hey") || msgLower.startsWith("saludos") || msgLower === "hi") {
    return `¡Hola ${senderName}! Qué gusto saludarte. ¿Qué novedades tienes hoy? ✨`;
  }

  // Handle gratitude / good vibes
  if (msgLower.includes("gracias") || msgLower.includes("agradezco") || msgLower.includes("genial") || msgLower.includes("excelente") || msgLower.includes("perfecto")) {
    return `¡De nada ${senderName}! Es un verdadero placer. Siempre que necesites cualquier cosa, aquí estoy 🙌✨`;
  }

  // Handle laughing
  if (msgLower.includes("jaja") || msgLower.includes("jeje") || msgLower.includes("lol") || msgLower.includes("xd")) {
    return `¡Jajaja total! Me hiciste reír 😂 ¡Eres lo máximo!`;
  }

  // Persona-specific customizations
  if (contactName.includes("Carlos")) {
    return `¡Entendido ${senderName}! Sobre lo que me dices ("${userMessage}"), me parece un gran punto. Les comento a los de talento humano para tenerlo en cuenta en la entrevista 💼🚀`;
  }

  if (contactName.includes("Sofia")) {
    return `¡Me parece fantástica esa idea, ${senderName}! Lo voy a integrar directamente en el prototipo de diseño en Figma 🎨🖌️`;
  }

  if (contactName.includes("Lucas")) {
    return `¡Entendido! Ya le eché un ojo a lo que comentas ("${userMessage}"). Lo paso al backlog del repo y lo testeamos 💻⚡`;
  }

  if (contactName.includes("Elena")) {
    return `¡Qué maravillosa perspectiva, ${senderName}! Encaja perfecto con el estilo visual y creativo que buscamos 🎬🌟`;
  }

  if (contactName.includes("MessengerPidgeon") || contactName.includes("Birdmessage") || contactName.includes("Copilot") || contactName.includes("IA")) {
    return `¡Entendido perfectamente! He procesado tu mensaje: "${userMessage}". Si quieres que elabore más, redacte un texto o te dé alternativas, ¡solo dímelo! 🕊️✨`;
  }

  // Universal dynamic response for any other contact or text
  return `¡Hola ${senderName}! Recibí tu mensaje: "${userMessage}". Me parece perfecto y estoy totalmente de acuerdo, ¡seguimos en contacto! 👍`;
}

// API for intelligent chat auto-reply across ANY conversation
app.post("/api/ai/chat-reply", async (req, res) => {
  try {
    const {
      chatId,
      contactName = "Contacto",
      contactType = "direct",
      senderName = "Ana Rodríguez",
      conversationHistory = [],
      lastUserMessage = "",
    } = req.body;

    const ai = getGenAI();

    if (!ai) {
      // Natural contextual fallback
      const replyText = generateFallbackReply(contactName, lastUserMessage, senderName);
      return res.json({
        replyText,
        source: "fallback",
        senderName: contactName,
      });
    }

    const personaInstructions: Record<string, string> = {
      "Carlos Mendoza": "Eres Carlos Mendoza, un reclutador tech y amigo muy cercano y alegre de Ana. Te entusiasma mucho haberle conseguido la entrevista de empleo para la agencia de diseño Nova. Eres positivo, empático, profesional pero muy cercano, y usas algún emoji oportuno como 🚀, 🙌, 💼, 👏.",
      "Sofia Benítez": "Eres Sofia Benítez, diseñadora UI/UX senior y colega de Ana. Eres detallista, apasionada por Figma, paletas de colores, microinteracciones y notas de voz. Respondes con calidez, entusiasmo creativo y tono colegial en español 🎨✨.",
      "Equipo de Proyecto": "Eres el canal grupal del 'Equipo de Proyecto' en una empresa tech moderna. Responde como David Lead o como portavoz del equipo, coordinando de forma ágil, respetuosa y colaborativa.",
      "Lucas Dev": "Eres Lucas Dev, desarrollador frontend/fullstack. Eres práctico, apasionado por el código limpio, commits, dependencias y café. Hablas como un dev moderno, directo y relajado 💻⚡.",
      "Elena Gómez": "Eres Elena Gómez, Directora Creativa y productora audiovisual. Tienes un estilo sofisticado, dinámico, moderno y visual 📹🌟.",
      "MessengerPidgeon AI": "Eres el asistente inteligente oficial de MessengerPidgeon. Eres sabio, amigable, conciso y muy útil en cualquier tema 🕊️✨.",
      "Birdmessage AI": "Eres el asistente inteligente oficial de MessengerPidgeon. Eres sabio, amigable, conciso y muy útil en cualquier tema 🕊️✨."
    };

    let specificPersona = personaInstructions[contactName];
    if (!specificPersona) {
      for (const [key, value] of Object.entries(personaInstructions)) {
        if (contactName.toLowerCase().includes(key.toLowerCase())) {
          specificPersona = value;
          break;
        }
      }
    }

    const persona =
      specificPersona ||
      `Eres ${contactName}, una persona real en una conversación de mensajería instantánea en español con ${senderName}. Responde de forma muy natural, empática y en primera persona como este contacto.`;

    // Format recent history context
    const historyText = Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? conversationHistory
          .slice(-6)
          .map((m: any) => `${m.senderName || (m.senderId === "me" ? senderName : contactName)}: ${m.text || m.type || ""}`)
          .join("\n")
      : "";

    const prompt = `Eres ${contactName}. ${persona}
Estás chateando en la app de mensajería instantánea "MessengerPidgeon" con ${senderName}.

Historial de la conversación:
${historyText ? historyText : `(Conversación iniciada)`}

Mensaje más reciente de ${senderName}: "${lastUserMessage}"

DIRECTRICES DE RESPUESTA:
1. Responde de forma directa, inteligente y coherente a exactamente lo que ${senderName} te acaba de decir o preguntar (ya sea una pregunta, saludo, broma, comentario, pedir consejo, opinión sobre una foto/sticker/audio, o cualquier tema).
2. Mantén tu personalidad y tono en primera persona.
3. El mensaje debe ser conciso y conversacional (1 a 3 frases fluidas), como en una app de chat móvil moderna.
4. NO uses prefijos de nombre (ej. "${contactName}:"), ni comillas envolventes, ni hables de ser un modelo de IA a menos que el personaje sea MessengerPidgeon AI o Birdmessage AI.
5. Responde siempre en español.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    const replyText = response.text?.trim() || generateFallbackReply(contactName, lastUserMessage, senderName);

    return res.json({
      replyText,
      source: "gemini",
      senderName: contactName,
    });
  } catch (err: unknown) {
    console.error("Error in /api/ai/chat-reply:", err);
    const fallback = generateFallbackReply(
      req.body.contactName || "Contacto",
      req.body.lastUserMessage || "",
      req.body.senderName || "Ana"
    );
    return res.json({
      replyText: fallback,
      source: "fallback",
      senderName: req.body.contactName || "Contacto",
    });
  }
});

// API for intelligent chat suggestions and Copilot
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { lastMessage, context = "empleo y agencia creativa", senderName = "Carlos Mendoza" } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Fallback high-quality contextual suggestions
      return res.json({
        suggestions: [
          `¡Genial ${senderName}! Muchas gracias. Tengo libre mañana después de las 2 PM.`,
          `¡Increíble noticia! Me interesa muchísimo, envíame los detalles de contacto.`,
          `¡Muchas gracias! Ya preparo mi CV y portafolio actualizado para enviártelo.`
        ],
        source: "fallback"
      });
    }

    const prompt = `Actúa como asistente de redacción inteligente para la aplicación de mensajería "MessengerPidgeon". 
El usuario recibió el siguiente mensaje de ${senderName}: "${lastMessage || '¿Cuándo tienes libre para una entrevista?'}".
Contexto: ${context}.
Genera 3 respuestas cortas, naturales, empáticas y listas para enviar en español (estilo chat moderno).
Devuelve ÚNICAMENTE un JSON array válido con 3 strings. Ejemplo: ["Respuesta 1", "Respuesta 2", "Respuesta 3"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ suggestions: parsed.slice(0, 3), source: "gemini" });
      }
    } catch {
      // if parsing fails, fallback
    }

    return res.json({
      suggestions: [
        `¡Genial ${senderName}! Muchas gracias. Tengo libre mañana después de las 2 PM.`,
        `¡Increíble noticia! Me interesa muchísimo, envíame los detalles de contacto.`,
        `¡Muchas gracias! Ya preparo mi portafolio para la entrevista.`
      ],
      source: "fallback"
    });
  } catch (err: unknown) {
    console.error("Error in /api/ai/suggest:", err);
    return res.json({
      suggestions: [
        "¡Genial! Muchas gracias. Tengo libre mañana después de las 2 PM.",
        "¡Increíble noticia! Me interesa muchísimo, envíame los detalles.",
        "¡Muchísimas gracias por recomendarme! 🙌"
      ],
      source: "fallback"
    });
  }
});

// Helper to smartly transform drafts locally if Gemini is unavailable
function transformDraftFallback(
  rawDraft: string,
  tone: string,
  recipient: string,
  customInstruction?: string
): string {
  const cleanDraft = (rawDraft || "").trim();
  const base = cleanDraft || "Muchas gracias por tu mensaje y la oportunidad.";

  switch (tone) {
    case "formal":
      return `Estimado/a ${recipient},\n\nLe escribo para comunicarle lo siguiente: ${base.charAt(0).toLowerCase() + base.slice(1)}. Agradezco de antemano su atención y quedo a su entera disposición para cualquier consulta.`;
    
    case "cv":
      return `¡Hola ${recipient}! Te comparto los detalles solicitados: ${base}\n\nPuedes revisar mi CV y portafolio actualizado en el siguiente enlace. Quedo atento a tus comentarios.`;
    
    case "casual":
      return `¡Hola ${recipient}! ${base} ¡Hablamos pronto y coordinamos! 🙌`;
    
    case "concise":
      return `${base.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}. Quedo atento.`;
    
    case "correct":
      // Capitalize first letter, ensure trailing period, trim spaces
      return base.charAt(0).toUpperCase() + base.slice(1) + (/[.!?]$/.test(base) ? "" : ".");
    
    case "persuasive":
      return `Hola ${recipient}, estoy convencido de que esto aportará gran valor: ${base} ¿Coordinamos los siguientes pasos para avanzar hoy mismo?`;
    
    case "empathetic":
      return `Hola ${recipient}, comprendo perfectamente la situación y te agradezco mucho la comunicación: ${base} Estoy aquí para lo que necesites. ✨`;
    
    case "bullet_points":
      return `Hola ${recipient}, te comparto los puntos principales:\n• ${base.replace(/\n+/g, '\n• ')}\n\nQuedo atento a tu respuesta.`;
    
    default:
      if (customInstruction) {
        return `Hola ${recipient}, respecto a tu consulta: ${base}`;
      }
      return base;
  }
}

// API for Copilot tone transformer / formalizer / resume assistant
app.post("/api/ai/transform", async (req, res) => {
  try {
    const {
      text = "",
      tone = "formal",
      recipient = "Contacto",
      customInstruction = "",
    } = req.body;

    const ai = getGenAI();

    if (!ai) {
      const fallbackResult = transformDraftFallback(text, tone, recipient, customInstruction);
      return res.json({
        result: fallbackResult,
        source: "fallback",
      });
    }

    const tonePrompts: Record<string, string> = {
      formal: "Reescribe este borrador en un tono formal, pulcro, diplomático y ejecutivo, ideal para comunicarse con reclutadores, directores o clientes.",
      cv: "Reescribe este borrador como un mensaje profesional de postulación laboral o presentación de perfil, mencionando disponibilidad y adjuntando CV/portafolio.",
      casual: "Reescribe este borrador en un tono casual, cálido, amistoso y relajado para una app de mensajería instantánea móvil, usando algún emoji adecuado.",
      concise: "Reescribe este borrador de forma ultra concisa y directa al grano (máximo 1 o 2 oraciones esenciales), eliminando rodeos innecesarios.",
      correct: "Corrige exclusivamente la ortografía, acentuación, puntuación y gramática del borrador, manteniendo exactamente el mismo estilo, vocabulario y tono original.",
      persuasive: "Reescribe este borrador con un tono persuasivo, elocuente y motivador que invite a la acción inmediata.",
      empathetic: "Reescribe este borrador con un tono empático, cálido, comprensivo y agradecido.",
      bullet_points: "Reescribe y organiza este borrador en puntos o viñetas claras (bullet points) para fácil lectura rápida.",
    };

    const toneInstruction = customInstruction
      ? `Aplica la siguiente instrucción específica: "${customInstruction}"`
      : tonePrompts[tone] || "Mejora la redacción haciéndola clara y profesional.";

    const prompt = `Actúa como el Transformador de Borradores IA de la app de mensajería MessengerPidgeon.
Objetivo: ${toneInstruction}

Destinatario del mensaje: ${recipient}
Borrador original del usuario:
"""
${text || "Gracias por la oportunidad laboral y coordinamos la reunión."}
"""

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE el texto final transformado listo para ser enviado o insertado en el chat.
2. NO incluyas introducciones como "Aquí está tu mensaje:", ni comillas envolventes, ni explicaciones meta.
3. Mantén el idioma en español con excelente naturalidad y redacción.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const result = response.text?.trim() || transformDraftFallback(text, tone, recipient, customInstruction);

    return res.json({
      result,
      source: "gemini",
    });
  } catch (err: unknown) {
    console.error("Error in /api/ai/transform:", err);
    const fallbackResult = transformDraftFallback(
      req.body.text || "",
      req.body.tone || "formal",
      req.body.recipient || "Contacto",
      req.body.customInstruction
    );
    return res.json({
      result: fallbackResult,
      source: "fallback",
    });
  }
});

// --- Realtime Multi-User Rooms & WebSockets for Real People ---
interface RealtimeUser {
  id: string;
  name: string;
  avatarUrl?: string;
  ws?: WebSocket;
  lastActive: number;
}

interface RealtimeRoom {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  createdAt: number;
  messages: any[];
  users: Map<string, RealtimeUser>;
}

const realtimeRooms = new Map<string, RealtimeRoom>();

function getOrCreateRoom(
  roomId: string,
  name?: string,
  type: 'public' | 'private' = 'public'
): RealtimeRoom {
  if (!realtimeRooms.has(roomId)) {
    const isCommunity = roomId === 'real_community';
    realtimeRooms.set(roomId, {
      id: roomId,
      name: name || (isCommunity ? 'Comunidad MessengerPidgeon en Vivo' : `Sala ${roomId}`),
      description: isCommunity
        ? 'Sala pública en vivo para chatear con personas reales en tiempo real'
        : 'Sala privada en vivo',
      type,
      createdAt: Date.now(),
      messages: isCommunity
        ? [
            {
              id: 'welcome_real_1',
              chatId: 'chat_real_community',
              senderId: 'system',
              senderName: 'MessengerPidgeon Sistema',
              senderAvatar:
                'https://lh3.googleusercontent.com/aida/AEtjO1VvtQ8SuH2_EitFNQxEyTzIpw6glVPrKUPxsORUbPpNTKlTseSeAQCrC0adE9NcPst4RmMHEvsbSd2cBZVOA7PzTQctMy6HNt31uSXCGex5yUYB7Q2eM8_awBgVAGz6kdseuptQwuVIXvU0BzOKuhuOsaKUsKDRroKdqqogyTlkDIpMmPYcR5BPD_eKlEWEmbHLPW2gxZh-gqsmW3qoO5NtI0dg9PjdSZWuFrd0Xpj51CLE7aXUPZtLGX4',
              type: 'text',
              text: '🌐 ¡Bienvenidos a la Sala en Vivo de MessengerPidgeon! Cualquier persona conectada puede hablar aquí en tiempo real. Abre esta app en otra pestaña, ventana o comparte el enlace para conversar con gente real.',
              timestamp: '12:00 PM',
              isRead: true,
              reactions: { '🌐': 3, '🚀': 2 },
            },
          ]
        : [
            {
              id: `welcome_${roomId}`,
              chatId: `chat_${roomId}`,
              senderId: 'system',
              senderName: 'MessengerPidgeon Sistema',
              senderAvatar:
                'https://lh3.googleusercontent.com/aida/AEtjO1VvtQ8SuH2_EitFNQxEyTzIpw6glVPrKUPxsORUbPpNTKlTseSeAQCrC0adE9NcPst4RmMHEvsbSd2cBZVOA7PzTQctMy6HNt31uSXCGex5yUYB7Q2eM8_awBgVAGz6kdseuptQwuVIXvU0BzOKuhuOsaKUsKDRroKdqqogyTlkDIpMmPYcR5BPD_eKlEWEmbHLPW2gxZh-gqsmW3qoO5NtI0dg9PjdSZWuFrd0Xpj51CLE7aXUPZtLGX4',
              type: 'text',
              text: `🔒 Sala en vivo creada. Invita a tu amigo compartiendo el enlace o el código de esta sala. Los mensajes se sincronizan al instante en tiempo real.`,
              timestamp: 'Ahora',
              isRead: true,
              reactions: { '🔒': 1 },
            },
          ],
      users: new Map(),
    });
  }
  return realtimeRooms.get(roomId)!;
}

// Prepopulate community room
getOrCreateRoom('real_community');

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = realtimeRooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(data);
  for (const user of room.users.values()) {
    if (user.ws && user.ws.readyState === WebSocket.OPEN && user.ws !== excludeWs) {
      try {
        user.ws.send(payload);
      } catch (err) {
        console.error('Error broadcasting to user:', err);
      }
    }
  }
}

function broadcastPresence(roomId: string) {
  const room = realtimeRooms.get(roomId);
  if (!room) return;
  const activeUsers = Array.from(room.users.values()).map((u) => ({
    id: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl,
  }));
  broadcastToRoom(roomId, {
    type: 'presence',
    roomId,
    count: activeUsers.length,
    users: activeUsers,
  });
}

// API: Get active real-time rooms
app.get('/api/realtime/rooms', (_req, res) => {
  const roomsList = Array.from(realtimeRooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    onlineCount: r.users.size,
    lastMessage: r.messages.length > 0 ? r.messages[r.messages.length - 1] : null,
    totalMessages: r.messages.length,
  }));
  res.json({ rooms: roomsList });
});

// API: Get room details and message history
app.get('/api/realtime/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  res.json({
    id: room.id,
    name: room.name,
    description: room.description,
    type: room.type,
    onlineCount: room.users.size,
    users: Array.from(room.users.values()).map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
    })),
    messages: room.messages.slice(-100),
  });
});

// API: Send a message via HTTP
app.post('/api/realtime/room/:roomId/message', (req, res) => {
  const { roomId } = req.params;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }
  const room = getOrCreateRoom(roomId);
  const msgObj = {
    ...message,
    id:
      message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp:
      message.timestamp ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  if (!room.messages.some((m) => m.id === msgObj.id)) {
    room.messages.push(msgObj);
    if (room.messages.length > 150) room.messages.shift();
  }
  broadcastToRoom(roomId, {
    type: 'message',
    roomId,
    message: msgObj,
  });
  broadcastPresence(roomId);
  res.json({ success: true, message: msgObj });
});

// API: Create custom room
app.post('/api/realtime/create-room', (req, res) => {
  const { name, roomId, type = 'private' } = req.body;
  const generatedId =
    roomId || `room_${Math.random().toString(36).substring(2, 8)}`;
  const room = getOrCreateRoom(generatedId, name || 'Sala de amigos', type);
  res.json({
    success: true,
    room: {
      id: room.id,
      name: room.name,
      type: room.type,
      onlineCount: room.users.size,
    },
  });
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'join') {
          const { roomId = 'real_community', user } = data;
          currentRoomId = roomId;
          currentUserId = user?.id || `user_${Date.now()}`;
          const room = getOrCreateRoom(roomId);
          room.users.set(currentUserId, {
            id: currentUserId,
            name: user?.name || 'Usuario',
            avatarUrl: user?.avatarUrl,
            ws,
            lastActive: Date.now(),
          });

          // Send init payload with history & online users
          ws.send(
            JSON.stringify({
              type: 'init',
              roomId,
              messages: room.messages.slice(-80),
              users: Array.from(room.users.values()).map((u) => ({
                id: u.id,
                name: u.name,
                avatarUrl: u.avatarUrl,
              })),
            })
          );

          broadcastPresence(roomId);
        } else if (data.type === 'message') {
          const { roomId, message } = data;
          const room = getOrCreateRoom(roomId);
          if (!room.messages.some((m) => m.id === message.id)) {
            room.messages.push(message);
            if (room.messages.length > 150) room.messages.shift();
          }
          broadcastToRoom(roomId, {
            type: 'message',
            roomId,
            message,
          });
        } else if (data.type === 'typing') {
          const { roomId, userId, userName, isTyping } = data;
          broadcastToRoom(
            roomId,
            {
              type: 'typing',
              roomId,
              userId,
              userName,
              isTyping,
            },
            ws
          );
        } else if (data.type === 'reaction') {
          const { roomId, messageId, emoji } = data;
          const room = getOrCreateRoom(roomId);
          const msg = room.messages.find((m) => m.id === messageId);
          if (msg) {
            msg.reactions = msg.reactions || {};
            msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
            broadcastToRoom(roomId, {
              type: 'reaction',
              roomId,
              messageId,
              reactions: msg.reactions,
            });
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentUserId) {
        const room = realtimeRooms.get(currentRoomId);
        if (room) {
          room.users.delete(currentUserId);
          broadcastPresence(currentRoomId);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MessengerPidgeon server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
