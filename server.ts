import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const webpush = require("web-push");

dotenv.config();

const app = express();
const PORT = 3000;

app.set("trust proxy", true);

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// In-memory voice audio storage for lightweight instant cross-device streaming
const voiceAudioStorage = new Map<string, { buffer: Buffer; mime: string }>();

// In-memory photo & video storage + disk cache to prevent exceeding Firestore 1MB limit and survive restarts
const MEDIA_CACHE_DIR = path.join(process.cwd(), ".media_cache");
try {
  if (!fs.existsSync(MEDIA_CACHE_DIR)) {
    fs.mkdirSync(MEDIA_CACHE_DIR, { recursive: true });
  }
} catch {}

const mediaStorage = new Map<string, { buffer: Buffer; mime: string }>();

function resolveMediaFormat(
  buffer: Buffer,
  rawMime: string,
  filename = ""
): { mime: string; ext: string; isVideo: boolean; kind: "video" | "audio" | "image" } {
  const baseMime = (rawMime || "").split(";")[0].trim().toLowerCase();
  const cleanFilename = (filename || "").toLowerCase();

  // Check audio magic bytes and extensions first (unless explicitly video)
  const isId3Mp3 =
    buffer.length >= 3 &&
    buffer[0] === 0x49 &&
    buffer[1] === 0x44 &&
    buffer[2] === 0x33;
  const isMp3Sync =
    buffer.length >= 2 &&
    buffer[0] === 0xff &&
    (buffer[1] & 0xe0) === 0xe0 &&
    !cleanFilename.endsWith(".aac");
  const isRiffWave =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE";
  const isOgg =
    buffer.length >= 4 &&
    buffer.subarray(0, 4).toString("ascii") === "OggS";
  const isFlac =
    buffer.length >= 4 &&
    buffer.subarray(0, 4).toString("ascii") === "fLaC";

  const isAudioExtension =
    cleanFilename.endsWith(".mp3") ||
    cleanFilename.endsWith(".wav") ||
    cleanFilename.endsWith(".ogg") ||
    cleanFilename.endsWith(".oga") ||
    cleanFilename.endsWith(".opus") ||
    cleanFilename.endsWith(".m4a") ||
    cleanFilename.endsWith(".aac") ||
    cleanFilename.endsWith(".flac") ||
    cleanFilename.endsWith(".weba");

  const isAudio =
    !baseMime.startsWith("video/") &&
    (baseMime.startsWith("audio/") ||
      isAudioExtension ||
      isId3Mp3 ||
      isMp3Sync ||
      isRiffWave ||
      isOgg ||
      isFlac);

  if (isAudio) {
    if (cleanFilename.endsWith(".wav") || baseMime.includes("wav") || isRiffWave) {
      return { mime: "audio/wav", ext: "wav", isVideo: false, kind: "audio" };
    }
    if (cleanFilename.endsWith(".ogg") || cleanFilename.endsWith(".oga") || cleanFilename.endsWith(".opus") || baseMime.includes("ogg") || isOgg) {
      return { mime: "audio/ogg", ext: "ogg", isVideo: false, kind: "audio" };
    }
    if (cleanFilename.endsWith(".flac") || baseMime.includes("flac") || isFlac) {
      return { mime: "audio/flac", ext: "flac", isVideo: false, kind: "audio" };
    }
    if (cleanFilename.endsWith(".m4a") || baseMime.includes("mp4") || baseMime.includes("m4a")) {
      return { mime: "audio/mp4", ext: "m4a", isVideo: false, kind: "audio" };
    }
    if (cleanFilename.endsWith(".aac") || baseMime.includes("aac")) {
      return { mime: "audio/aac", ext: "aac", isVideo: false, kind: "audio" };
    }
    if (cleanFilename.endsWith(".weba") || baseMime === "audio/webm") {
      return { mime: "audio/webm", ext: "weba", isVideo: false, kind: "audio" };
    }
    return { mime: "audio/mpeg", ext: "mp3", isVideo: false, kind: "audio" };
  }

  // Check container magic bytes for videos so WebM is never mislabeled as MP4
  const isEbmlWebm =
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3;

  const isIsoMp4 =
    buffer.length >= 8 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp";

  const isVideo =
    isEbmlWebm ||
    isIsoMp4 ||
    baseMime.startsWith("video/") ||
    cleanFilename.endsWith(".mp4") ||
    cleanFilename.endsWith(".mov") ||
    cleanFilename.endsWith(".webm") ||
    cleanFilename.endsWith(".mkv") ||
    cleanFilename.endsWith(".3gp") ||
    cleanFilename.endsWith(".m4v");

  if (isVideo) {
    if (isEbmlWebm || (!isIsoMp4 && (baseMime.includes("webm") || baseMime.includes("matroska") || cleanFilename.endsWith(".webm") || cleanFilename.endsWith(".mkv")))) {
      return { mime: "video/webm", ext: "webm", isVideo: true, kind: "video" };
    }
    return { mime: "video/mp4", ext: "mp4", isVideo: true, kind: "video" };
  }

  if (cleanFilename.endsWith(".png") || baseMime.includes("png")) {
    return { mime: "image/png", ext: "png", isVideo: false, kind: "image" };
  }
  if (cleanFilename.endsWith(".webp") || baseMime.includes("webp")) {
    return { mime: "image/webp", ext: "webp", isVideo: false, kind: "image" };
  }
  if (cleanFilename.endsWith(".gif") || baseMime.includes("gif")) {
    return { mime: "image/gif", ext: "gif", isVideo: false, kind: "image" };
  }
  return { mime: "image/jpeg", ext: "jpg", isVideo: false, kind: "image" };
}

function storeMediaBuffer(buffer: Buffer, mime: string, ext: string): string {
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  mediaStorage.set(mediaId, { buffer, mime });

  try {
    fs.writeFileSync(path.join(MEDIA_CACHE_DIR, mediaId), buffer);
  } catch (err) {
    console.warn("Media disk write notice:", err);
  }

  if (mediaStorage.size > 150) {
    const oldestKeys = Array.from(mediaStorage.keys()).slice(0, 30);
    oldestKeys.forEach((k) => mediaStorage.delete(k));
  }

  return mediaId;
}

// Helper to normalize phone numbers
function cleanPhone(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "").trim();
}

// VAPID keys initialization for Web Push Notifications (works with screen off and app closed)
const VAPID_FILE = path.join(process.cwd(), ".vapid.json");
let vapidKeys: { publicKey: string; privateKey: string };

try {
  if (fs.existsSync(VAPID_FILE)) {
    const raw = fs.readFileSync(VAPID_FILE, "utf-8");
    vapidKeys = JSON.parse(raw);
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
  }
} catch (e) {
  vapidKeys = webpush.generateVAPIDKeys();
}

try {
  webpush.setVapidDetails(
    "mailto:soporte@pidgex.app",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("[Push] VAPID configured successfully. Public key ready.");
} catch (err) {
  console.error("VAPID setup error:", err);
}

// Push subscriptions storage for wake-up calls & alerts
interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  userPhoneClean?: string;
  updatedAt: number;
}

const PUSH_SUBS_FILE = path.join(process.cwd(), ".push_subs.json");
const pushSubscriptions = new Map<string, PushSubscriptionRecord>();

try {
  if (fs.existsSync(PUSH_SUBS_FILE)) {
    const rawSubs = JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, "utf-8"));
    if (Array.isArray(rawSubs)) {
      for (const item of rawSubs) {
        if (item.endpoint && item.keys) {
          pushSubscriptions.set(item.endpoint, item);
        }
      }
    }
  }
} catch (e) {}

function savePushSubscriptions() {
  try {
    const subsArray = Array.from(pushSubscriptions.values());
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(subsArray, null, 2), "utf-8");
  } catch (e) {}
}

const DEFAULT_PUSH_ICON = "/assets/aistudio/Logo_de_PidgeX_5e3aa7b3.PNG";

function safePushIconUrl(raw?: string): string {
  if (!raw || typeof raw !== "string") return DEFAULT_PUSH_ICON;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.length > 350) {
    return DEFAULT_PUSH_ICON;
  }
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return DEFAULT_PUSH_ICON;
}

function pushPhonesMatch(a?: string, b?: string): boolean {
  const ca = cleanPhone(a);
  const cb = cleanPhone(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  const strip16 = (s: string) => (s.startsWith("16") && s.length > 9 ? s.slice(2) : s);
  if (strip16(ca) === strip16(cb)) return true;
  if (ca.length >= 9 && cb.length >= 9 && ca.slice(-9) === cb.slice(-9)) return true;
  return false;
}

function findMatchingSubscriptions(
  recipients: Array<{ phone?: string; id?: string }>
): PushSubscriptionRecord[] {
  const matched = new Map<string, PushSubscriptionRecord>();
  for (const sub of pushSubscriptions.values()) {
    for (const r of recipients) {
      const matchPhone = Boolean(r.phone && sub.userPhoneClean && pushPhonesMatch(r.phone, sub.userPhoneClean));
      const matchId = Boolean(r.id && sub.userId && sub.userId === r.id);
      if (matchPhone || matchId) {
        matched.set(sub.endpoint, sub);
        break;
      }
    }
  }
  return Array.from(matched.values());
}

async function sendWebPushBatch(
  subs: PushSubscriptionRecord[],
  payloadObj: Record<string, any>,
  options: { TTL: number; urgency: "very-low" | "low" | "normal" | "high"; topic?: string }
): Promise<number> {
  const payload = JSON.stringify(payloadObj);
  let delivered = 0;
  const sendPromises = subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload,
        options
      );
      delivered += 1;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        pushSubscriptions.delete(sub.endpoint);
        savePushSubscriptions();
      } else {
        console.warn("[Push] Send failed for endpoint:", err?.statusCode || err?.message || err);
      }
    }
  });
  await Promise.allSettled(sendPromises);
  return delivered;
}

// Active calls tracking on server + continuous background ring timers (WhatsApp-style)
interface ActiveCallServerRecord {
  callId: string;
  callerName: string;
  callerPhone?: string;
  callerAvatar?: string;
  receiverId?: string;
  receiverPhone?: string;
  recipients?: Array<{ phone?: string; id?: string }>;
  isVideo: boolean;
  isGroup?: boolean;
  chatId?: string;
  status: 'ringing' | 'connected' | 'ended' | 'declined' | 'accepted';
  createdAt: number;
}
const activeCallsServerMap = new Map<string, ActiveCallServerRecord>();
const activeCallRingTimers = new Map<string, ReturnType<typeof setInterval>>();

function stopBackgroundCallRingTimer(callId: string) {
  const timer = activeCallRingTimers.get(callId);
  if (timer) {
    clearInterval(timer);
    activeCallRingTimers.delete(callId);
  }
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "MessengerPidgeon",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    pushSubscriptionsCount: pushSubscriptions.size
  });
});

// API: Get VAPID public key for browser ServiceWorker registration
app.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// API: Check if user currently has an active push subscription on server
app.get("/api/push/status", (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : "";
  const userPhone = typeof req.query.userPhone === "string" ? req.query.userPhone : "";
  const matches = findMatchingSubscriptions([{ id: userId || undefined, phone: userPhone || undefined }]);
  return res.json({
    subscribed: matches.length > 0,
    devicesCount: matches.length,
    totalSubscriptions: pushSubscriptions.size,
  });
});

// API: Subscribe browser / phone to OS Push Notifications
app.post("/api/push/subscribe", (req, res) => {
  try {
    const { subscription, userId, userPhone } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }
    const cleanNum = cleanPhone(userPhone);
    const existing = pushSubscriptions.get(subscription.endpoint);
    const record: PushSubscriptionRecord = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userId: (userId && userId !== "me" && userId !== "user_me" ? userId : existing?.userId) || userId || undefined,
      userPhoneClean: cleanNum || existing?.userPhoneClean || undefined,
      updatedAt: Date.now(),
    };
    pushSubscriptions.set(subscription.endpoint, record);
    savePushSubscriptions();
    console.log(`[Push] Subscribed device for user ${record.userId || "unknown"} (phone: ${record.userPhoneClean || "none"}). Total subs: ${pushSubscriptions.size}`);
    return res.json({ success: true, registered: true, devicesCount: pushSubscriptions.size });
  } catch (err) {
    console.error("Error saving push subscription:", err);
    return res.status(500).json({ error: "Failed to save push subscription" });
  }
});

// API: Test background Web Push (immediate or delayed e.g. 5s so user can lock phone / close app)
app.post("/api/push/test", async (req, res) => {
  try {
    const { kind = "message", delaySeconds = 0, userId, userPhone, userName, endpoint } = req.body || {};
    const safeDelay = Math.max(0, Math.min(15, Number(delaySeconds) || 0));

    const sendNow = async () => {
      let targetSubs: PushSubscriptionRecord[] = [];
      if (endpoint && pushSubscriptions.has(endpoint)) {
        targetSubs = [pushSubscriptions.get(endpoint)!];
      } else {
        targetSubs = findMatchingSubscriptions([{ id: userId, phone: userPhone }]);
      }
      if (targetSubs.length === 0) return 0;

      if (kind === "call") {
        const testCallId = `test_call_${Date.now()}`;
        return await sendWebPushBatch(
          targetSubs,
          {
            type: "call",
            callId: testCallId,
            callerName: userName || "Llamada de Prueba PidgeX",
            callerPhone: cleanPhone(userPhone),
            callerAvatar: DEFAULT_PUSH_ICON,
            icon: DEFAULT_PUSH_ICON,
            isVideo: false,
            isTest: true,
            title: "📞 Llamada entrante de Prueba",
            body: "Pantalla activa y vibración estilo WhatsApp. Toca Contestar o Rechazar.",
            url: `/?autoAnswerCall=${testCallId}`,
          },
          { TTL: 45, urgency: "high", topic: "pidgex_test_call" }
        );
      }

      return await sendWebPushBatch(
        targetSubs,
        {
          type: "message",
          chatId: "test_notif",
          title: "PidgeX • Notificación Activa",
          body: "¡Listo! Tu celular sonó con su tono del sistema y vibró correctamente.",
          icon: DEFAULT_PUSH_ICON,
          url: "/",
        },
        { TTL: 300, urgency: "high" }
      );
    };

    if (safeDelay > 0) {
      setTimeout(() => {
        sendNow().catch(() => {});
      }, safeDelay * 1000);
      return res.json({ success: true, scheduled: true, delaySeconds: safeDelay });
    }

    const delivered = await sendNow();
    return res.json({ success: true, delivered });
  } catch (err) {
    console.error("Error sending test push:", err);
    return res.status(500).json({ error: "Failed to send test push" });
  }
});

// API: Trigger Call Push Notification when app is closed / screen is off (WhatsApp-style ringing)
app.post("/api/calls/trigger", async (req, res) => {
  try {
    const {
      callId,
      callerName,
      callerPhone,
      callerAvatar,
      receiverId,
      receiverPhone,
      recipients,
      isVideo,
      isGroup,
      chatId,
    } = req.body;

    if (!callId) {
      return res.status(400).json({ error: "Missing callId" });
    }

    const cleanReceiver = cleanPhone(receiverPhone);
    const cleanCaller = cleanPhone(callerPhone);
    const safeIcon = safePushIconUrl(callerAvatar);

    const recipientList: Array<{ phone?: string; id?: string }> = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      recipients.forEach((r: any) => {
        if (r && (r.phone || r.id)) {
          recipientList.push({ phone: cleanPhone(r.phone), id: r.id });
        }
      });
    }
    if (cleanReceiver || receiverId) {
      recipientList.push({ phone: cleanReceiver || undefined, id: receiverId || undefined });
    }

    const callRecord: ActiveCallServerRecord = {
      callId,
      callerName: callerName || "Usuario PidgeX",
      callerPhone: cleanCaller,
      callerAvatar: safeIcon,
      receiverId,
      receiverPhone: cleanReceiver,
      recipients: recipientList,
      isVideo: Boolean(isVideo),
      isGroup: Boolean(isGroup),
      chatId,
      status: "ringing",
      createdAt: Date.now(),
    };
    activeCallsServerMap.set(callId, callRecord);
    stopBackgroundCallRingTimer(callId);

    const targetSubs = findMatchingSubscriptions(recipientList);
    console.log(`[Call Trigger] Call ${callId} to ${recipientList.map((r) => r.phone || r.id).join(", ")}. Found ${targetSubs.length} device subscriptions.`);

    const buildCallPayload = (ringNumber: number) => ({
      type: "call",
      callId,
      callerName: callerName || "Usuario PidgeX",
      callerPhone: cleanCaller,
      callerAvatar: safeIcon,
      icon: safeIcon,
      isVideo: Boolean(isVideo),
      isGroup: Boolean(isGroup),
      chatId,
      ringNumber,
      title: isVideo
        ? `📹 Videollamada de ${callerName || "PidgeX"}`
        : `📞 Llamada de ${callerName || "PidgeX"}`,
      body: isVideo
        ? `Videollamada entrante de ${callerName || "un amigo"} • Toca para contestar`
        : `Llamada entrante de ${callerName || "un amigo"} • Toca para contestar`,
      url: `/?autoAnswerCall=${callId}`,
    });

    const delivered = await sendWebPushBatch(targetSubs, buildCallPayload(1), {
      TTL: 45,
      urgency: "high",
      topic: `call_${callId.slice(-12)}`,
    });

    // Keep ringing in background like WhatsApp (re-pulse every 6.5s up to 4 extra pulses while status === 'ringing')
    if (targetSubs.length > 0) {
      let pulseCount = 1;
      const ringTimer = setInterval(async () => {
        const current = activeCallsServerMap.get(callId);
        if (!current || current.status !== "ringing" || pulseCount >= 5) {
          stopBackgroundCallRingTimer(callId);
          return;
        }
        pulseCount += 1;
        const freshSubs = findMatchingSubscriptions(current.recipients || recipientList);
        if (freshSubs.length === 0) {
          stopBackgroundCallRingTimer(callId);
          return;
        }
        await sendWebPushBatch(freshSubs, buildCallPayload(pulseCount), {
          TTL: 30,
          urgency: "high",
          topic: `call_${callId.slice(-12)}`,
        });
      }, 6500);
      activeCallRingTimers.set(callId, ringTimer);
    }

    return res.json({
      success: true,
      notifiedDevices: delivered,
      matchedSubscriptions: targetSubs.length,
      callId,
    });
  } catch (err) {
    console.error("Error triggering call push notification:", err);
    return res.status(500).json({ error: "Failed to trigger call push notification" });
  }
});

// API: Check Call Status for arriving receiver tab
app.get("/api/calls/check", (req, res) => {
  const { callId } = req.query;
  if (!callId || typeof callId !== "string") {
    return res.status(400).json({ error: "Missing callId" });
  }
  const call = activeCallsServerMap.get(callId);
  return res.json({ call: call || null });
});

// API: End Call on server (stops background ringing and closes/updates OS call notification)
app.post("/api/calls/end", async (req, res) => {
  const { callId, status } = req.body;
  if (callId) {
    stopBackgroundCallRingTimer(callId);
    const call = activeCallsServerMap.get(callId);
    if (call) {
      const wasRinging = call.status === "ringing";
      call.status = status || "ended";
      const targetSubs = findMatchingSubscriptions(
        call.recipients && call.recipients.length > 0
          ? call.recipients
          : [{ phone: call.receiverPhone, id: call.receiverId }]
      );
      if (targetSubs.length > 0) {
        const isMissed = wasRinging && (status === "ended" || status === "missed");
        sendWebPushBatch(
          targetSubs,
          {
            type: "call_ended",
            callId,
            missed: isMissed,
            callerName: call.callerName,
            isVideo: call.isVideo,
            chatId: call.chatId,
            icon: safePushIconUrl(call.callerAvatar),
            title: isMissed ? `📞 Llamada perdida de ${call.callerName}` : "Llamada finalizada",
            body: isMissed
              ? `No pudiste contestar la ${call.isVideo ? "videollamada" : "llamada"} de ${call.callerName}.`
              : "",
            url: call.chatId ? `/?chatId=${call.chatId}` : "/",
          },
          { TTL: 120, urgency: "high", topic: `call_${callId.slice(-12)}` }
        ).catch(() => {});
      }
      setTimeout(() => {
        activeCallsServerMap.delete(callId);
      }, 300000);
    }
  }
  return res.json({ success: true });
});

// API: Send Push for new chat messages when app is closed or in background
app.post("/api/messages/trigger", async (req, res) => {
  try {
    const { chatId, message, receiverPhone, receiverId } = req.body;
    if (!message || (!receiverPhone && !receiverId)) {
      return res.status(400).json({ error: "Missing message or receiver info" });
    }

    const cleanReceiver = cleanPhone(receiverPhone);
    const targetSubs = findMatchingSubscriptions([
      { phone: cleanReceiver || undefined, id: receiverId || undefined },
    ]);

    let bodyText = message.text || "Nuevo mensaje";
    if (message.type === "voice") bodyText = "🎙️ Mensaje de voz";
    if (message.type === "image") bodyText = "📸 Foto adjunta";
    if (message.type === "video") bodyText = "🎬 Video adjunto";
    if (message.type === "sticker") bodyText = `🌟 Sticker: ${message.stickerTitle || ""}`;
    if (message.type === "game_invite") bodyText = `🎮 ${message.gameData?.title || "Invitación a juego grupal"}`;

    const delivered = await sendWebPushBatch(
      targetSubs,
      {
        type: "message",
        chatId,
        messageId: message.id,
        title: `${message.senderName || "PidgeX"}`,
        body: bodyText.slice(0, 180),
        icon: safePushIconUrl(message.senderAvatar),
        url: chatId ? `/?chatId=${encodeURIComponent(chatId)}` : "/",
      },
      { TTL: 3600, urgency: "high" }
    );

    return res.json({ success: true, notifiedDevices: delivered });
  } catch (err) {
    return res.status(500).json({ error: "Failed to trigger message push" });
  }
});

function parseBase64DataUrl(dataUrl: string): { rawMime: string; buffer: Buffer } | null {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return null;
  }
  const marker = ";base64,";
  const markerIdx = dataUrl.indexOf(marker);
  if (markerIdx === -1) {
    return null;
  }
  const rawMime = dataUrl.slice(5, markerIdx).trim();
  const base64Data = dataUrl.slice(markerIdx + marker.length).trim();
  if (!base64Data) {
    return null;
  }
  return {
    rawMime,
    buffer: Buffer.from(base64Data, "base64"),
  };
}

// API: Upload voice message audio to avoid exceeding Firestore 1MB document limit
app.post("/api/audio/upload", express.json({ limit: "25mb" }), (req, res) => {
  try {
    const parsed = parseBase64DataUrl(req.body?.dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid base64 audio format" });
    }
    const mime = parsed.rawMime.split(";")[0].trim() || "audio/webm";
    const buffer = parsed.buffer;
    const audioId = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    voiceAudioStorage.set(audioId, { buffer, mime });

    // Rotate storage if it exceeds 200 items
    if (voiceAudioStorage.size > 200) {
      const oldestKeys = Array.from(voiceAudioStorage.keys()).slice(0, 40);
      oldestKeys.forEach((k) => voiceAudioStorage.delete(k));
    }

    return res.json({
      success: true,
      audioUrl: `/api/audio/${audioId}`,
      size: buffer.length,
    });
  } catch (err) {
    console.error("Audio upload error:", err);
    return res.status(500).json({ error: "Audio upload failed" });
  }
});

// API: Stream voice message audio directly with range headers for smooth seeking & playback
app.get("/api/audio/:audioId", (req, res) => {
  const { audioId } = req.params;
  const item = voiceAudioStorage.get(audioId);
  if (!item) {
    return res.status(404).send("Audio not found");
  }
  res.setHeader("Content-Type", item.mime || "audio/wav");
  res.setHeader("Content-Length", item.buffer.length);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.send(item.buffer);
});

// API: Upload raw binary photo or video blob directly (faster, no base64 bloat, preserves exact bytes)
app.post("/api/media/upload-raw", express.raw({ type: () => true, limit: "50mb" }), (req, res) => {
  try {
    const buffer = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === "string"
      ? Buffer.from(req.body)
      : null;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: "Empty media payload" });
    }

    const rawMime = String(req.headers["content-type"] || "");
    const rawFilename = String(req.query.filename || req.headers["x-filename"] || "");
    const { mime, ext, kind } = resolveMediaFormat(buffer, rawMime, rawFilename);
    const mediaId = storeMediaBuffer(buffer, mime, ext);

    return res.json({
      success: true,
      mediaUrl: `/api/media/${mediaId}`,
      mediaType: kind,
      mimeType: mime,
      size: buffer.length,
    });
  } catch (err) {
    console.error("Raw media upload error:", err);
    return res.status(500).json({ error: "Raw media upload failed" });
  }
});

// API: Upload photo or video via base64 data URL (supports ;codecs=... parameters cleanly)
app.post("/api/media/upload", express.json({ limit: "50mb" }), (req, res) => {
  try {
    const { dataUrl, filename } = req.body || {};
    const parsed = parseBase64DataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid base64 media format" });
    }

    const { mime, ext, kind } = resolveMediaFormat(parsed.buffer, parsed.rawMime, filename || "");
    const mediaId = storeMediaBuffer(parsed.buffer, mime, ext);

    return res.json({
      success: true,
      mediaUrl: `/api/media/${mediaId}`,
      mediaType: kind,
      mimeType: mime,
      size: parsed.buffer.length,
    });
  } catch (err) {
    console.error("Media upload error:", err);
    return res.status(500).json({ error: "Media upload failed" });
  }
});

// API: Stream media (videos, audio and photos) directly with range headers for smooth seeking & playback
app.get("/api/media/:mediaId", (req, res) => {
  const safeId = path.basename(req.params.mediaId || "");
  let item = mediaStorage.get(safeId);

  if (!item && safeId) {
    try {
      const diskPath = path.join(MEDIA_CACHE_DIR, safeId);
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        const { mime } = resolveMediaFormat(buffer, "", safeId);
        item = { buffer, mime };
        mediaStorage.set(safeId, item);
      }
    } catch {}
  }

  if (!item) {
    return res.status(404).send("Media not found");
  }

  const totalLength = item.buffer.length;
  const mimeType =
    item.mime ||
    (safeId.endsWith(".webm")
      ? "video/webm"
      : safeId.endsWith(".mp4")
      ? "video/mp4"
      : safeId.endsWith(".mp3")
      ? "audio/mpeg"
      : safeId.endsWith(".wav")
      ? "audio/wav"
      : safeId.endsWith(".ogg")
      ? "audio/ogg"
      : safeId.endsWith(".m4a")
      ? "audio/mp4"
      : safeId.endsWith(".aac")
      ? "audio/aac"
      : safeId.endsWith(".weba")
      ? "audio/webm"
      : "application/octet-stream");

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const parsedStart = parseInt(parts[0], 10);
    const parsedEnd = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
    const start = Number.isNaN(parsedStart) ? 0 : Math.max(0, parsedStart);
    const end = Number.isNaN(parsedEnd)
      ? totalLength - 1
      : Math.min(totalLength - 1, parsedEnd);

    if (start >= totalLength || start > end) {
      res.setHeader("Content-Range", `bytes */${totalLength}`);
      return res.status(416).send("Requested range not satisfiable");
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalLength}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=86400",
    });
    return res.end(item.buffer.subarray(start, end + 1));
  }

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", totalLength);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.send(item.buffer);
});

// API: Live GIF Search (searches Tenor web GIFs for instant meme & reaction GIFs)
const gifSearchCache = new Map<string, { results: { id: string; title: string; url: string }[]; ts: number }>();

app.get("/api/gifs/search", async (req, res) => {
  try {
    const rawQ = String(req.query.q || "").trim();
    if (!rawQ) {
      return res.json({ gifs: [] });
    }
    const cacheKey = rawQ.toLowerCase();
    const cached = gifSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 1000 * 60 * 15) {
      return res.json({ gifs: cached.results });
    }

    const slug = encodeURIComponent(
      rawQ
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñü\s-]/gi, " ")
        .trim()
        .replace(/\s+/g, "-")
    );

    const response = await fetch(`https://tenor.com/search/${slug}-gifs`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return res.json({ gifs: [] });
    }

    const html = await response.text();
    const imgRegex = /<img[^>]+src="(https:\/\/media1?\.tenor\.com\/[^"]+\.gif)"[^>]*?(?:alt="([^"]*)")?[^>]*>/gi;
    const seen = new Set<string>();
    const results: { id: string; title: string; url: string }[] = [];

    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null && results.length < 24) {
      const url = match[1];
      const alt = (match[2] || rawQ).trim();
      if (!seen.has(url) && !url.includes("tenor-logo")) {
        seen.add(url);
        results.push({
          id: `tenor_${results.length}_${Date.now()}`,
          title: alt.slice(0, 48) || rawQ,
          url,
        });
      }
    }

    if (results.length > 0) {
      gifSearchCache.set(cacheKey, { results, ts: Date.now() });
      if (gifSearchCache.size > 60) {
        const firstKey = gifSearchCache.keys().next().value;
        if (firstKey) gifSearchCache.delete(firstKey);
      }
    }

    return res.json({ gifs: results });
  } catch (err) {
    console.warn("GIF search error:", err);
    return res.json({ gifs: [] });
  }
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
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        temperature: 0.8,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
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
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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



// Helper to craft expressive die-cut SVG stickers cleanly
function buildVectorStickerSvg(opts: {
  title: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  innerShapesSvg?: string;
}): string {
  const safeTitle = String(opts.title || "STICKER")
    .replace(/[<>&"']/g, "")
    .slice(0, 22)
    .toUpperCase();
  const safeEmoji = String(opts.emoji || "✨").replace(/[<>&"']/g, "").slice(0, 6);
  const inner = opts.innerShapesSvg || `
    <circle cx="160" cy="140" r="64" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" stroke-width="4" />
    <text x="160" y="164" text-anchor="middle" font-size="82" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${safeEmoji}</text>
  `;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
    <defs>
      <linearGradient id="stBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${opts.primaryColor}" />
        <stop offset="100%" stop-color="${opts.secondaryColor}" />
      </linearGradient>
      <filter id="stShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#stShadow)">
      <rect x="24" y="24" width="272" height="272" rx="68" fill="#ffffff" />
      <rect x="34" y="34" width="252" height="252" rx="58" fill="url(#stBg)" />
      <circle cx="72" cy="72" r="14" fill="${opts.accentColor}" opacity="0.7" />
      <circle cx="248" cy="82" r="10" fill="#ffffff" opacity="0.5" />
      ${inner}
      <rect x="52" y="224" width="216" height="44" rx="22" fill="#0f172a" stroke="#ffffff" stroke-width="3.5" />
      <text x="160" y="252" text-anchor="middle" fill="#ffffff" font-family="Plus Jakarta Sans, Arial, sans-serif" font-weight="800" font-size="18" letter-spacing="1">${safeTitle}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

// API: AI Sticker Factory (Prompt -> Die-cut Vector Sticker)
app.post("/api/ai/sticker", async (req, res) => {
  try {
    const { prompt = "gato espacial feliz", style = "pop", emoji = "✨" } = req.body || {};
    const ai = getGenAI();

    if (!ai) {
      const palettes: Record<string, [string, string, string]> = {
        pop: ["#ec4899", "#8b5cf6", "#fde047"],
        cyber: ["#06b6d4", "#2563eb", "#22d3ee"],
        pastel: ["#fb7185", "#f59e0b", "#fef08a"],
        dark: ["#1e293b", "#0f172a", "#38bdf8"],
      };
      const [c1, c2, acc] = palettes[style] || palettes.pop;
      const svgDataUrl = buildVectorStickerSvg({
        title: prompt.slice(0, 18),
        emoji,
        primaryColor: c1,
        secondaryColor: c2,
        accentColor: acc,
      });
      return res.json({
        source: "fallback",
        title: prompt.slice(0, 24),
        subtitle: `Estilo ${style}`,
        imageUrl: svgDataUrl,
      });
    }

    const aiPrompt = `Diseña un sticker die-cut creativo basado en esta descripción: "${prompt}" (estilo visual: "${style}", emoji guía: "${emoji}").
Devuelve un JSON con:
- "title": etiqueta corta llamativa en español (máx 18 chars)
- "emoji": el mejor emoji central expresivo
- "primaryColor": color hex brillante #RRGGBB
- "secondaryColor": segundo color hex #RRGGBB
- "accentColor": color hex de acento #RRGGBB
- "illustrationSvg": fragmento SVG válido SIN etiqueta <svg> externa (solo elementos <circle>, <ellipse>, <rect>, <path>, <polygon>, <text> dentro del área central x=70..250, y=55..210) que ilustre el concepto de forma adorable y limpia.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            emoji: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            illustrationSvg: { type: Type.STRING },
          },
          required: ["title", "emoji", "primaryColor", "secondaryColor", "accentColor"],
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const rawSvg = String(parsed.illustrationSvg || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/on\w+=/gi, "");
    const svgDataUrl = buildVectorStickerSvg({
      title: parsed.title || prompt,
      emoji: parsed.emoji || emoji,
      primaryColor: /^#[0-9a-f]{6}$/i.test(parsed.primaryColor) ? parsed.primaryColor : "#2563eb",
      secondaryColor: /^#[0-9a-f]{6}$/i.test(parsed.secondaryColor) ? parsed.secondaryColor : "#7c3aed",
      accentColor: /^#[0-9a-f]{6}$/i.test(parsed.accentColor) ? parsed.accentColor : "#38bdf8",
      innerShapesSvg: rawSvg || undefined,
    });

    return res.json({
      source: "gemini",
      title: parsed.title || prompt.slice(0, 24),
      subtitle: "Creado con IA",
      imageUrl: svgDataUrl,
    });
  } catch (err: any) {
    console.error("Error in /api/ai/sticker:", err);
    return res.status(500).json({ error: err?.message || "No se pudo generar el sticker" });
  }
});

// API: AI Chat Personality Theme Generator
app.post("/api/ai/theme", async (req, res) => {
  try {
    const { prompt = "futurista espacial azul neón" } = req.body || {};
    const ai = getGenAI();

    if (!ai) {
      const p = String(prompt).toLowerCase();
      const preset = p.includes("román") || p.includes("amor") || p.includes("rosa")
        ? {
            name: "Romance Estelar",
            headerGradient: "from-rose-600 via-pink-600 to-fuchsia-600",
            bubbleMeBg: "#e11d48",
            bubbleMeText: "#ffffff",
            bubbleThemBg: "#2a1626",
            bubbleThemText: "#ffe4e6",
            accentColor: "#fb7185",
            sendEffect: "hearts",
            soundPack: "soft",
            animatedBg: "particles",
          }
        : p.includes("bosque") || p.includes("natur") || p.includes("verde")
        ? {
            name: "Bosque Bioluminiscente",
            headerGradient: "from-emerald-700 via-teal-600 to-cyan-700",
            bubbleMeBg: "#059669",
            bubbleMeText: "#ffffff",
            bubbleThemBg: "#122622",
            bubbleThemText: "#d1fae5",
            accentColor: "#34d399",
            sendEffect: "bubbles",
            soundPack: "soft",
            animatedBg: "aurora",
          }
        : {
            name: `Tema ${prompt.slice(0, 18)}`,
            headerGradient: "from-cyan-600 via-blue-700 to-indigo-800",
            bubbleMeBg: "#0284c7",
            bubbleMeText: "#ffffff",
            bubbleThemBg: "#172033",
            bubbleThemText: "#e0f2fe",
            accentColor: "#38bdf8",
            sendEffect: "sparks",
            soundPack: "cyber",
            animatedBg: "stars",
          };
      return res.json({
        source: "fallback",
        theme: { id: `ai_theme_${Date.now()}`, ...preset },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Crea un tema visual personalizado para una app de mensajería basado en: "${prompt}".
Elige colores con excelente legibilidad (texto blanco sobre fondos oscuros/saturados o texto oscuro sobre fondos claros).
Para "headerGradient" usa clases Tailwind válidas de gradiente, ej: "from-indigo-600 via-sky-600 to-cyan-500".
"sendEffect" debe ser uno de: "none", "confetti", "hearts", "sparks", "bubbles".
"soundPack" debe ser uno de: "default", "cyber", "soft", "retro".
"animatedBg" debe ser uno de: "none", "aurora", "stars", "particles".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            headerGradient: { type: Type.STRING },
            bubbleMeBg: { type: Type.STRING },
            bubbleMeText: { type: Type.STRING },
            bubbleThemBg: { type: Type.STRING },
            bubbleThemText: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            sendEffect: { type: Type.STRING },
            soundPack: { type: Type.STRING },
            animatedBg: { type: Type.STRING },
          },
          required: ["name", "headerGradient", "bubbleMeBg", "bubbleMeText", "bubbleThemBg", "bubbleThemText", "accentColor"],
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      source: "gemini",
      theme: {
        id: `ai_theme_${Date.now()}`,
        name: parsed.name || "Tema IA",
        headerGradient: parsed.headerGradient || "from-cyan-600 to-blue-700",
        bubbleMeBg: parsed.bubbleMeBg || "#0284c7",
        bubbleMeText: parsed.bubbleMeText || "#ffffff",
        bubbleThemBg: parsed.bubbleThemBg || "#1e293b",
        bubbleThemText: parsed.bubbleThemText || "#f8fafc",
        accentColor: parsed.accentColor || "#38bdf8",
        sendEffect: parsed.sendEffect || "sparks",
        soundPack: parsed.soundPack || "cyber",
        animatedBg: parsed.animatedBg || "aurora",
      },
    });
  } catch (err: any) {
    console.error("Error in /api/ai/theme:", err);
    return res.status(500).json({ error: err?.message || "No se pudo crear el tema" });
  }
});

// API: Analyze selfie photo to generate matching Digital Avatar traits
app.post("/api/ai/avatar-analyze", async (req, res) => {
  try {
    const { imageDataUrl } = req.body || {};
    const parsed = parseBase64DataUrl(imageDataUrl);
    const ai = getGenAI();

    if (!ai || !parsed) {
      return res.json({
        source: "local",
        traits: null,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: [
        {
          inlineData: {
            mimeType: parsed.rawMime || "image/jpeg",
            data: parsed.buffer.toString("base64"),
          },
        },
        `Observa el rostro de la foto y sugiere rasgos estilizados para crear un avatar digital:
- skinTone: color hex aproximado de piel
- hairStyle: uno de "short", "long", "curly", "bob", "spiky", "bun", "mohawk", "none"
- hairColor: color hex de cabello
- eyeColor: color hex de ojos
- accessory: "glasses" o "sunglasses" si usa lentes, sino "none"
- outfitColor: color hex que combine con la ropa vista`,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinTone: { type: Type.STRING },
            hairStyle: { type: Type.STRING },
            hairColor: { type: Type.STRING },
            eyeColor: { type: Type.STRING },
            accessory: { type: Type.STRING },
            outfitColor: { type: Type.STRING },
          },
          required: ["skinTone", "hairStyle", "hairColor", "eyeColor"],
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const traits = JSON.parse(response.text || "{}");
    return res.json({ source: "gemini", traits });
  } catch (err) {
    console.warn("Avatar analyze fallback:", err);
    return res.json({ source: "local", traits: null });
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
  gameState?: any;
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

let globalWss: WebSocketServer | null = null;

function broadcastChatMessage(roomId: string, message: any, excludeWs?: WebSocket) {
  const room = getOrCreateRoom(roomId);
  const msgObj = {
    ...message,
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp:
      message.timestamp ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  if (!room.messages.some((m) => m.id === msgObj.id)) {
    room.messages.push(msgObj);
    if (room.messages.length > 200) room.messages.shift();
  }

  const payload = JSON.stringify({
    type: 'message',
    roomId,
    message: msgObj,
  });

  if (globalWss) {
    globalWss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error('Error broadcasting chat message to client:', err);
        }
      }
    });
  }

  broadcastPresence(roomId);
  return msgObj;
}

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
  const msgObj = broadcastChatMessage(roomId, message);
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

// ============================================================================
// Server-Authoritative Multiplayer Group Games Engine (Trivia, Draw, Truth/Dare)
// ============================================================================
const SERVER_TRIVIA_BANK = [
  { id: 'tq1', category: 'Cultura', question: '¿Cuál es el océano más grande del planeta Tierra?', options: ['Océano Atlántico', 'Océano Índico', 'Océano Pacífico', 'Océano Ártico'], correctIndex: 2 },
  { id: 'tq2', category: 'Ciencia', question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Mercurio', 'Marte', 'Tierra'], correctIndex: 1 },
  { id: 'tq3', category: 'Cine', question: '¿Qué estudio creó películas como Toy Story y Coco?', options: ['DreamWorks', 'Pixar', 'Illumination', 'Sony Pictures'], correctIndex: 1 },
  { id: 'tq4', category: 'Geografía', question: '¿En qué país se encuentra la famosa torre Eiffel?', options: ['Italia', 'España', 'Francia', 'Alemania'], correctIndex: 2 },
  { id: 'tq5', category: 'Tecnología', question: '¿Qué significa la sigla "Wi-Fi" en la vida cotidiana?', options: ['Conexión inalámbrica de red', 'Cable de fibra óptica', 'Batería de litio', 'Radio satelital'], correctIndex: 0 },
  { id: 'tq6', category: 'Deportes', question: '¿Cuántos jugadores tiene cada equipo en la cancha en fútbol 11?', options: ['9', '10', '11', '12'], correctIndex: 2 },
  { id: 'tq7', category: 'Música', question: '¿Cuántas cuerdas tiene normalmente una guitarra clásica?', options: ['4', '5', '6', '8'], correctIndex: 2 },
  { id: 'tq8', category: 'Naturaleza', question: '¿Qué animal es conocido por dormir de pie y poder correr muy rápido?', options: ['Caballo', 'Koala', 'Pingüino', 'Nutria'], correctIndex: 0 },
  { id: 'tq9', category: 'Gastronomía', question: '¿De qué país es originario el taco tradicional?', options: ['Perú', 'México', 'Colombia', 'Chile'], correctIndex: 1 },
  { id: 'tq10', category: 'Ciencia', question: '¿Qué gas necesitan los humanos principalmente para respirar?', options: ['Nitrógeno', 'Oxígeno', 'Helio', 'Argón'], correctIndex: 1 },
  { id: 'tq11', category: 'Historia', question: '¿En qué año llegó el ser humano por primera vez a la Luna?', options: ['1959', '1969', '1975', '1981'], correctIndex: 1 },
  { id: 'tq12', category: 'Arte', question: '¿Quién pintó "La noche estrellada"?', options: ['Pablo Picasso', 'Salvador Dalí', 'Vincent van Gogh', 'Leonardo da Vinci'], correctIndex: 2 },
  { id: 'tq13', category: 'Geografía', question: '¿Cuál es el río más largo de América del Sur?', options: ['Río Orinoco', 'Río Amazonas', 'Río Paraná', 'Río Magdalena'], correctIndex: 1 },
  { id: 'tq14', category: 'Videojuegos', question: '¿De qué color es la gorra clásica de Mario Bros?', options: ['Azul', 'Verde', 'Roja', 'Amarilla'], correctIndex: 2 },
];

const SERVER_DRAW_WORDS = [
  'Cohete', 'Paloma', 'Pizza', 'Guitarra', 'Dinosaurio', 'Playa',
  'Robot', 'Castillo', 'Mariposa', 'Helado', 'Volcán', 'Bicicleta',
  'Unicornio', 'Telescopio', 'Hamburguesa', 'Pulpo', 'Reloj', 'Montaña',
  'Gato', 'Corona', 'Submarino', 'Fuego', 'Arcoíris', 'Dragón',
];

const SERVER_TRUTHS = [
  '¿Cuál ha sido tu momento más gracioso frente a tus amigos?',
  'Si pudieras viajar mañana a cualquier país, ¿cuál elegirías y por qué?',
  '¿Qué talento secreto tienes que casi nadie en este grupo conoce?',
  '¿Cuál es la comida más rara que has probado y te gustó?',
  '¿Qué canción cantas a todo pulmón cuando nadie te escucha?',
  '¿Cuál ha sido tu mayor logro este año?',
  'Si ganaras un premio millonario hoy, ¿qué sería lo primero que harías?',
];

const SERVER_DARES = [
  'Envía una nota de voz de 5 segundos imitando a tu animal favorito.',
  'Escribe en el chat un cumplido divertido para cada persona conectada.',
  'Cambia tu estado o manda un sticker describiendo cómo te sientes ahora.',
  'Cuenta un chiste corto o adivinanza en el grupo ahora mismo.',
  'Di 3 cosas por las que estés agradecido hoy.',
  'Escribe una frase usando solo emojis para que el grupo la adivine.',
  'Envía un saludo épico como si fueras locutor de radio.',
];

function stripAccentsServer(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function maskSecretWord(word: string): string {
  return word
    .split('')
    .map((ch) => (ch === ' ' ? ' ' : '_'))
    .join(' ');
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function upsertGamePlayer(players: any[], actor: { id: string; name: string; avatarUrl?: string; phone?: string }) {
  if (!actor || !actor.id) return players;
  const idx = players.findIndex((p) => p.id === actor.id);
  if (idx >= 0) {
    const updated = [...players];
    updated[idx] = {
      ...updated[idx],
      name: actor.name || updated[idx].name,
      avatarUrl: actor.avatarUrl || updated[idx].avatarUrl,
    };
    return updated;
  }
  return [
    ...players,
    {
      id: actor.id,
      name: actor.name || 'Jugador',
      avatarUrl: actor.avatarUrl || '',
      phone: actor.phone || '',
      score: 0,
      joinedAt: Date.now(),
    },
  ];
}

function processGroupGameAction(
  chatId: string,
  actor: { id: string; name: string; avatarUrl?: string; phone?: string },
  action: string,
  payload: any = {}
) {
  const room = getOrCreateRoom(chatId);
  const now = Date.now();

  if (action === 'START_GAME') {
    const gameType = payload.gameType || 'trivia';
    const initialPlayers: any[] = [];
    const seededMembers = Array.isArray(payload.seedPlayers) ? payload.seedPlayers : [];
    let players = upsertGamePlayer(initialPlayers, actor);
    seededMembers.forEach((m: any) => {
      if (m && m.id && m.id !== actor.id) {
        players = upsertGamePlayer(players, m);
      }
    });

    const gameId = `gg_${now}_${Math.random().toString(36).substring(2, 6)}`;
    const titles: Record<string, string> = {
      trivia: 'Trivia Grupal en Vivo',
      draw: 'Dibuja y Adivina',
      truth_dare: 'Verdad o Reto Grupal',
    };

    if (gameType === 'trivia') {
      const totalRounds = Math.min(8, Math.max(3, Number(payload.totalRounds) || 5));
      const questions = shuffleArray(SERVER_TRIVIA_BANK).slice(0, totalRounds);
      room.gameState = {
        gameId,
        chatId,
        gameType: 'trivia',
        title: titles.trivia,
        status: 'active',
        hostId: actor.id,
        hostName: actor.name,
        players,
        round: 0,
        totalRounds: questions.length,
        triviaQuestions: questions,
        triviaAnswers: {},
        roundStartedAt: now,
        updatedAt: now,
      };
    } else if (gameType === 'draw') {
      const secretWord = SERVER_DRAW_WORDS[Math.floor(Math.random() * SERVER_DRAW_WORDS.length)];
      room.gameState = {
        gameId,
        chatId,
        gameType: 'draw',
        title: titles.draw,
        status: 'active',
        hostId: actor.id,
        hostName: actor.name,
        players,
        round: 0,
        totalRounds: Math.max(3, players.length),
        drawerId: actor.id,
        drawerName: actor.name,
        secretWord,
        maskedWord: maskSecretWord(secretWord),
        strokes: [],
        guesses: [],
        roundWinners: [],
        updatedAt: now,
      };
    } else {
      room.gameState = {
        gameId,
        chatId,
        gameType: 'truth_dare',
        title: titles.truth_dare,
        status: 'active',
        hostId: actor.id,
        hostName: actor.name,
        players,
        round: 0,
        totalRounds: 10,
        selectedPlayerId: actor.id,
        selectedPlayerName: actor.name,
        truthOrDareMode: null,
        truthOrDarePrompt: null,
        truthOrDareHistory: [],
        updatedAt: now,
      };
    }
  } else if (!room.gameState) {
    return null;
  } else {
    const gs = room.gameState;
    gs.players = upsertGamePlayer(gs.players || [], actor);
    gs.updatedAt = now;

    if (action === 'JOIN_GAME') {
      // Player already upserted above
    } else if (action === 'TRIVIA_ANSWER' && gs.gameType === 'trivia' && gs.status === 'active') {
      const roundIdx = typeof payload.round === 'number' ? payload.round : gs.round;
      if (roundIdx === gs.round) {
        gs.triviaAnswers = gs.triviaAnswers || {};
        gs.triviaAnswers[roundIdx] = gs.triviaAnswers[roundIdx] || {};
        if (!gs.triviaAnswers[roundIdx][actor.id]) {
          const q = gs.triviaQuestions?.[roundIdx];
          const optionIndex = Number(payload.optionIndex);
          const isCorrect = Boolean(q && optionIndex === q.correctIndex);
          const elapsedSec = Math.max(0, (now - (gs.roundStartedAt || now)) / 1000);
          const speedBonus = isCorrect ? Math.max(0, Math.round((15 - Math.min(15, elapsedSec)) * 5)) : 0;
          const points = isCorrect ? 100 + speedBonus : 0;
          gs.triviaAnswers[roundIdx][actor.id] = { optionIndex, isCorrect, points };
          if (points > 0) {
            gs.players = gs.players.map((p: any) =>
              p.id === actor.id ? { ...p, score: (p.score || 0) + points } : p
            );
          }
        }
      }
    } else if (action === 'TRIVIA_NEXT_ROUND' && gs.gameType === 'trivia') {
      if (gs.round + 1 >= (gs.totalRounds || 5)) {
        gs.status = 'finished';
      } else {
        gs.round += 1;
        gs.roundStartedAt = now;
      }
    } else if (action === 'DRAW_STROKE' && gs.gameType === 'draw' && gs.status === 'active') {
      if (actor.id === gs.drawerId && payload.stroke) {
        gs.strokes = gs.strokes || [];
        gs.strokes.push(payload.stroke);
        if (gs.strokes.length > 400) gs.strokes.shift();
      }
    } else if (action === 'DRAW_CLEAR' && gs.gameType === 'draw' && gs.status === 'active') {
      if (actor.id === gs.drawerId) {
        gs.strokes = [];
      }
    } else if (action === 'DRAW_GUESS' && gs.gameType === 'draw' && gs.status === 'active') {
      const guessText = String(payload.text || '').trim();
      if (guessText && actor.id !== gs.drawerId) {
        const isCorrect =
          Boolean(gs.secretWord) &&
          stripAccentsServer(guessText) === stripAccentsServer(gs.secretWord);
        gs.guesses = gs.guesses || [];
        gs.guesses.push({
          id: `g_${now}_${Math.random().toString(36).substring(2, 6)}`,
          userId: actor.id,
          userName: actor.name,
          text: isCorrect ? `🎉 ¡${actor.name} adivinó la palabra!` : guessText,
          isCorrect,
          timestamp: now,
        });
        if (gs.guesses.length > 40) gs.guesses.shift();

        if (isCorrect && !(gs.roundWinners || []).includes(actor.id)) {
          gs.roundWinners = [...(gs.roundWinners || []), actor.id];
          gs.players = gs.players.map((p: any) => {
            if (p.id === actor.id) return { ...p, score: (p.score || 0) + 100 };
            if (p.id === gs.drawerId) return { ...p, score: (p.score || 0) + 60 };
            return p;
          });
        }
      }
    } else if (action === 'DRAW_NEXT_TURN' && gs.gameType === 'draw') {
      const nextRound = (gs.round || 0) + 1;
      const list = gs.players || [];
      const currentIdx = list.findIndex((p: any) => p.id === gs.drawerId);
      const nextPlayer = list.length > 0 ? list[(currentIdx + 1) % list.length] : actor;
      const nextWord = SERVER_DRAW_WORDS[Math.floor(Math.random() * SERVER_DRAW_WORDS.length)];
      gs.round = nextRound;
      gs.drawerId = nextPlayer.id;
      gs.drawerName = nextPlayer.name;
      gs.secretWord = nextWord;
      gs.maskedWord = maskSecretWord(nextWord);
      gs.strokes = [];
      gs.roundWinners = [];
      gs.guesses = [
        {
          id: `sys_${now}`,
          userId: 'system',
          userName: 'Sistema',
          text: `🎨 Nuevo turno: ahora dibuja ${nextPlayer.name}`,
          isCorrect: false,
          timestamp: now,
        },
      ];
    } else if (action === 'SPIN_WHEEL' && gs.gameType === 'truth_dare' && gs.status === 'active') {
      const list = gs.players || [];
      if (list.length > 0) {
        const picked = list[Math.floor(Math.random() * list.length)];
        gs.selectedPlayerId = picked.id;
        gs.selectedPlayerName = picked.name;
        gs.truthOrDareMode = null;
        gs.truthOrDarePrompt = null;
      }
    } else if (action === 'PICK_TRUTH_DARE' && gs.gameType === 'truth_dare' && gs.status === 'active') {
      const mode = payload.mode === 'dare' ? 'dare' : 'truth';
      const customPrompt = typeof payload.customPrompt === 'string' && payload.customPrompt.trim() ? payload.customPrompt.trim() : null;
      const bank = mode === 'truth' ? SERVER_TRUTHS : SERVER_DARES;
      gs.truthOrDareMode = mode;
      gs.truthOrDarePrompt = customPrompt || bank[Math.floor(Math.random() * bank.length)];
    } else if (action === 'COMPLETE_TRUTH_DARE' && gs.gameType === 'truth_dare' && gs.status === 'active') {
      const completed = Boolean(payload.completed);
      if (gs.truthOrDarePrompt) {
        gs.truthOrDareHistory = gs.truthOrDareHistory || [];
        gs.truthOrDareHistory.unshift({
          id: `td_${now}`,
          playerName: gs.selectedPlayerName || actor.name,
          mode: gs.truthOrDareMode || 'truth',
          prompt: gs.truthOrDarePrompt,
          completed,
        });
        if (gs.truthOrDareHistory.length > 20) gs.truthOrDareHistory.pop();
      }
      if (completed && gs.selectedPlayerId) {
        gs.players = gs.players.map((p: any) =>
          p.id === gs.selectedPlayerId ? { ...p, score: (p.score || 0) + 50 } : p
        );
      }
      gs.round = (gs.round || 0) + 1;
      gs.truthOrDareMode = null;
      gs.truthOrDarePrompt = null;
    } else if (action === 'END_GAME') {
      gs.status = 'finished';
    }
  }

  broadcastToRoom(chatId, {
    type: 'game_event',
    roomId: chatId,
    gameType: room.gameState.gameType,
    action,
    payload,
    gameState: room.gameState,
    senderId: actor.id,
    senderName: actor.name,
  });

  return room.gameState;
}

app.get('/api/group-games/:chatId', (req, res) => {
  const { chatId } = req.params;
  const room = realtimeRooms.get(chatId);
  return res.json({ ok: true, gameState: room?.gameState || null });
});

app.post('/api/group-games/:chatId/action', (req, res) => {
  const { chatId } = req.params;
  const { actor, action, payload } = req.body || {};
  if (!actor || !actor.id || typeof action !== 'string') {
    return res.status(400).json({ error: 'Datos de jugada inválidos.' });
  }
  const gameState = processGroupGameAction(chatId, actor, action, payload || {});
  return res.json({ ok: true, gameState });
});

// ============================================================================
// Authentication: Salted scrypt password hashing, uniqueness, & account state
// ============================================================================
const AUTH_ACCOUNTS_FILE = path.join(MEDIA_CACHE_DIR, "auth_accounts.json");
const ACCOUNT_STATES_DIR = path.join(MEDIA_CACHE_DIR, "account_states");
try {
  if (!fs.existsSync(ACCOUNT_STATES_DIR)) {
    fs.mkdirSync(ACCOUNT_STATES_DIR, { recursive: true });
  }
} catch {}

const SESSION_SECRET_FILE = path.join(MEDIA_CACHE_DIR, ".session_secret");
function getOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const saved = fs.readFileSync(SESSION_SECRET_FILE, "utf-8").trim();
      if (saved.length >= 32) return saved;
    }
    const generated = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(SESSION_SECRET_FILE, generated, "utf-8");
    return generated;
  } catch {
    return crypto.randomBytes(32).toString("hex");
  }
}
const SESSION_SECRET = getOrCreateSessionSecret();
const SESSION_COOKIE_NAME = "pidgex_session";

interface StoredAuthAccount {
  userId: string;
  username: string;
  name: string;
  bio: string;
  phone: string;
  avatarUrl: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
}

interface StoredAccountState {
  user?: Record<string, any>;
  chats?: any[];
  updatedAt?: number;
}

const authAccountsById = new Map<string, StoredAuthAccount>();

function normalizePhoneDigitsServer(phone?: string): { full: string; core: string } {
  const full = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  const core = full.startsWith("16") ? full.slice(2) : full;
  return { full, core };
}

function resolveAccountStatePath(userId: string): string | null {
  if (!userId || !/^[a-zA-Z0-9_-]{3,128}$/.test(userId)) {
    return null;
  }
  const baseDir = path.resolve(ACCOUNT_STATES_DIR);
  const resolved = path.resolve(baseDir, `${userId}.json`);
  if (!resolved.startsWith(baseDir + path.sep)) {
    return null;
  }
  return resolved;
}

function loadAccountState(userId: string): StoredAccountState | null {
  try {
    const filePath = resolveAccountStatePath(userId);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        user: parsed.user && typeof parsed.user === "object" ? parsed.user : undefined,
        chats: Array.isArray(parsed.chats) ? parsed.chats : undefined,
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      };
    }
  } catch (err) {
    console.warn("Could not load account state:", err);
  }
  return null;
}

function saveAccountState(userId: string, state: StoredAccountState): boolean {
  try {
    const filePath = resolveAccountStatePath(userId);
    if (!filePath) return false;
    const payload: StoredAccountState = {
      user: state.user && typeof state.user === "object" ? state.user : undefined,
      chats: Array.isArray(state.chats) ? state.chats : undefined,
      updatedAt: Date.now(),
    };
    const tmpFile = `${filePath}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload), "utf-8");
    fs.renameSync(tmpFile, filePath);
    return true;
  } catch (err) {
    console.warn("Could not save account state:", err);
    return false;
  }
}

function deleteAccountState(userId: string) {
  try {
    const filePath = resolveAccountStatePath(userId);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}

function loadAuthAccounts() {
  try {
    if (fs.existsSync(AUTH_ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(AUTH_ACCOUNTS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        authAccountsById.clear();
        for (const acc of list) {
          if (acc && typeof acc.userId === "string" && typeof acc.passwordHash === "string") {
            authAccountsById.set(acc.userId, acc);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not load auth accounts cache:", err);
  }
}

function saveAuthAccounts() {
  try {
    const tmpFile = `${AUTH_ACCOUNTS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(Array.from(authAccountsById.values()), null, 2), "utf-8");
    fs.renameSync(tmpFile, AUTH_ACCOUNTS_FILE);
  } catch (err) {
    console.warn("Could not persist auth accounts cache:", err);
  }
}

loadAuthAccounts();

function hashPasswordScrypt(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPasswordScrypt(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function isPhoneUsedByOtherAccount(phone: string, excludeUserId?: string): boolean {
  const target = normalizePhoneDigitsServer(phone);
  if (target.full.length < 6) return false;
  for (const existing of authAccountsById.values()) {
    if (excludeUserId && existing.userId === excludeUserId) continue;
    const ex = normalizePhoneDigitsServer(existing.phone);
    if (!ex.full) continue;
    if (ex.full === target.full || (target.core.length >= 7 && ex.core === target.core)) {
      return true;
    }
  }
  return false;
}

function signSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyRawToken(token: string): string | null {
  if (!token) return null;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return typeof parsed?.uid === "string" ? parsed.uid : null;
  } catch {
    return null;
  }
}

function readCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function verifySessionFromRequest(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const uid = verifyRawToken(authHeader.slice(7));
    if (uid) return uid;
  }
  const cookieToken = readCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);
  if (cookieToken) {
    return verifyRawToken(cookieToken);
  }
  return null;
}

function isHttpsRequest(req: express.Request): boolean {
  const proto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  return req.secure || proto.includes("https");
}

function setSessionCookie(req: express.Request, res: express.Response, token: string) {
  const isHttps = isHttpsRequest(req);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
  });
}

function clearSessionCookie(req: express.Request, res: express.Response) {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
  });
}

function sanitizePublicAccount(acc: StoredAuthAccount) {
  return {
    userId: acc.userId,
    username: acc.username,
    name: acc.name,
    bio: acc.bio,
    phone: acc.phone,
    avatarUrl: acc.avatarUrl,
    createdAt: acc.createdAt,
  };
}

app.post('/api/auth/check-phone', (req, res) => {
  const { phone, currentUserId } = req.body || {};
  if (typeof phone !== 'string') {
    return res.json({ taken: false });
  }
  const taken = isPhoneUsedByOtherAccount(phone, typeof currentUserId === 'string' ? currentUserId : undefined);
  return res.json({ taken });
});

app.post('/api/auth/find-user', (req, res) => {
  const { phone, currentUserId } = req.body || {};
  if (typeof phone !== 'string') {
    return res.json({ found: false, isSelf: false, user: null });
  }
  const target = normalizePhoneDigitsServer(phone);
  if (target.full.length < 5) {
    return res.json({ found: false, isSelf: false, user: null });
  }
  for (const acc of authAccountsById.values()) {
    const accDigits = normalizePhoneDigitsServer(acc.phone);
    const matches =
      (accDigits.full && accDigits.full === target.full) ||
      (accDigits.core.length >= 6 && target.core.length >= 6 && accDigits.core === target.core);
    if (matches) {
      const isSelf = Boolean(currentUserId && acc.userId === currentUserId);
      return res.json({
        found: true,
        isSelf,
        user: {
          id: acc.userId,
          name: acc.name,
          username: acc.username,
          phone: acc.phone,
          avatarUrl: acc.avatarUrl,
        },
      });
    }
  }
  return res.json({ found: false, isSelf: false, user: null });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const {
      password,
      name,
      username,
      bio,
      phone,
      avatarUrl,
      initialChats,
      initialUser,
    } = req.body || {};

    if (typeof password !== 'string' || password.length < 4 || password.length > 128) {
      return res.status(400).json({ error: 'Tu contraseña de PidgeX debe tener entre 4 y 128 caracteres.' });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Ingresa tu nombre completo (mínimo 2 letras).' });
    }
    if (typeof username !== 'string' || username.trim().replace(/^@+/, '').length < 3) {
      return res.status(400).json({ error: 'Ingresa un nombre de usuario válido (mínimo 3 caracteres).' });
    }
    const phoneDigits = normalizePhoneDigitsServer(typeof phone === 'string' ? phone : '');
    if (phoneDigits.full.length < 8) {
      return res.status(400).json({ error: 'Ingresa un número de teléfono válido de al menos 8 dígitos.' });
    }

    const rawUser = username.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
    const normUsername = `@${rawUser}`;

    // Enforce unique phone number across all accounts
    if (isPhoneUsedByOtherAccount(phone)) {
      return res.status(409).json({
        error: 'Ese número de teléfono ya está registrado en otra cuenta. No se puede repetir.',
      });
    }

    // Enforce unique password across all accounts (name & username can repeat)
    for (const existing of authAccountsById.values()) {
      if (verifyPasswordScrypt(password, existing.salt, existing.passwordHash)) {
        return res.status(409).json({
          error: 'Esa contraseña ya está en uso por otra cuenta. No se puede repetir contraseña.',
        });
      }
    }

    const cleanId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const { salt, hash } = hashPasswordScrypt(password);

    const cleanBio = typeof bio === 'string' && bio.trim() ? bio.trim().slice(0, 160) : 'Disponible en PidgeX';

    const newAccount: StoredAuthAccount = {
      userId: cleanId,
      username: normUsername,
      name: name.trim().slice(0, 60),
      bio: cleanBio,
      phone: phone.trim(),
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : '',
      salt,
      passwordHash: hash,
      createdAt: Date.now(),
    };

    authAccountsById.set(cleanId, newAccount);
    saveAuthAccounts();

    if (Array.isArray(initialChats) || (initialUser && typeof initialUser === 'object')) {
      saveAccountState(cleanId, {
        user: initialUser && typeof initialUser === 'object' ? { ...initialUser, id: cleanId } : undefined,
        chats: Array.isArray(initialChats) ? initialChats : undefined,
      });
    }

    const token = signSessionToken(cleanId);
    setSessionCookie(req, res, token);
    return res.status(201).json({
      ok: true,
      token,
      account: sanitizePublicAccount(newAccount),
      savedState: loadAccountState(cleanId),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'No se pudo crear la cuenta en el servidor.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { password } = req.body || {};

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Ingresa tu contraseña de PidgeX.' });
    }

    let matched: StoredAuthAccount | undefined;
    for (const acc of authAccountsById.values()) {
      if (verifyPasswordScrypt(password, acc.salt, acc.passwordHash)) {
        matched = acc;
        break;
      }
    }

    if (!matched) {
      return res.status(401).json({
        error: 'Esa contraseña no existe en PidgeX. Verifica tu contraseña o crea una cuenta en Iniciar sesión.',
      });
    }

    const token = signSessionToken(matched.userId);
    setSessionCookie(req, res, token);
    const savedState = loadAccountState(matched.userId);
    return res.json({
      ok: true,
      token,
      account: sanitizePublicAccount(matched),
      savedState,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error al validar la contraseña en el servidor.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(req, res);
  return res.json({ ok: true });
});

app.get('/api/auth/state', (req, res) => {
  const uid = verifySessionFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Sesión no autorizada.' });
  }
  const acc = authAccountsById.get(uid);
  if (!acc) {
    return res.status(404).json({ error: 'Cuenta no encontrada.' });
  }
  return res.json({
    ok: true,
    account: sanitizePublicAccount(acc),
    savedState: loadAccountState(uid),
  });
});

app.put('/api/auth/state', (req, res) => {
  const uid = verifySessionFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Sesión no autorizada.' });
  }
  const acc = authAccountsById.get(uid);
  if (!acc) {
    return res.status(404).json({ error: 'Cuenta no encontrada.' });
  }

  const { user, chats } = req.body || {};
  if (user && typeof user === 'object') {
    if (typeof user.phone === 'string' && isPhoneUsedByOtherAccount(user.phone, uid)) {
      return res.status(409).json({
        error: 'Este número de teléfono ya está registrado en otra cuenta.',
      });
    }
    if (typeof user.name === 'string' && user.name.trim()) {
      acc.name = user.name.trim().slice(0, 60);
    }
    if (typeof user.username === 'string' && user.username.trim()) {
      const norm = `@${user.username.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}`;
      acc.username = norm;
    }
    if (typeof user.bio === 'string') {
      acc.bio = user.bio.trim().slice(0, 160);
    }
    if (typeof user.phone === 'string' && user.phone.trim()) {
      acc.phone = user.phone.trim();
    }
    if (typeof user.avatarUrl === 'string') {
      acc.avatarUrl = user.avatarUrl;
    }
    authAccountsById.set(uid, acc);
    saveAuthAccounts();
  }

  const existingState = loadAccountState(uid) || {};
  saveAccountState(uid, {
    user: user && typeof user === 'object' ? { ...user, id: uid, email: '' } : existingState.user,
    chats: Array.isArray(chats) ? chats : existingState.chats,
  });

  return res.json({ ok: true });
});

app.delete('/api/auth/account', (req, res) => {
  const uid = verifySessionFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Sesión no autorizada.' });
  }
  authAccountsById.delete(uid);
  saveAuthAccounts();
  deleteAccountState(uid);
  clearSessionCookie(req, res);
  return res.json({ ok: true });
});

app.use('/api', (_req, res) => {
  return res.status(404).json({ error: 'Ruta de API no encontrada en el servidor.' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      return res.status(413).json({ error: 'Los datos son demasiado pesados para enviarlos de una vez.' });
    }
    return res.status(err?.status || 500).json({ error: err?.message || 'Error interno del servidor.' });
  }
  return next(err);
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  globalWss = wss;

  wss.on('connection', (ws: WebSocket) => {
    const socketRooms = new Set<string>();
    const socketConnId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let currentUserId: string = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let currentUserData: any = null;

    const getRoomMemberKey = (roomId: string) =>
      roomId.startsWith('call_') ? `${currentUserId}_${socketConnId}` : currentUserId;

    const ensureJoinedCallRoom = (roomId: string) => {
      if (!roomId || !roomId.startsWith('call_')) return;
      const room = getOrCreateRoom(roomId);
      const memberKey = getRoomMemberKey(roomId);
      if (!room.users.has(memberKey)) {
        socketRooms.add(roomId);
        room.users.set(memberKey, {
          id: currentUserId,
          name: currentUserData?.name || 'Usuario',
          avatarUrl: currentUserData?.avatarUrl,
          ws,
          lastActive: Date.now(),
        });
      }
    };

    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'join') {
          const { roomId = 'real_community', user } = data;
          if (user) {
            currentUserId = user.id || currentUserId;
            currentUserData = user;
          }
          socketRooms.add(roomId);
          const room = getOrCreateRoom(roomId);
          room.users.set(getRoomMemberKey(roomId), {
            id: currentUserId,
            name: currentUserData?.name || 'Usuario',
            avatarUrl: currentUserData?.avatarUrl,
            ws,
            lastActive: Date.now(),
          });

          // Send init payload with history, online users & active game state
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
              gameState: room.gameState || null,
            })
          );

          broadcastPresence(roomId);
        } else if (data.type === 'leave') {
          const { roomId } = data;
          if (roomId) {
            socketRooms.delete(roomId);
            const room = realtimeRooms.get(roomId);
            if (room) {
              room.users.delete(getRoomMemberKey(roomId));
              room.users.delete(currentUserId);
              broadcastPresence(roomId);
            }
          }
        } else if (data.type === 'message') {
          const { roomId, message } = data;
          broadcastChatMessage(roomId, message, ws);
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
        } else if (data.type === 'game_event') {
          const { roomId, gameType, action, payload, gameState } = data;
          const room = getOrCreateRoom(roomId);
          if (gameState) {
            room.gameState = gameState;
          }
          broadcastToRoom(
            roomId,
            {
              type: 'game_event',
              roomId,
              gameType,
              action,
              payload,
              gameState: room.gameState || null,
              senderId: currentUserId,
              senderName: currentUserData?.name || 'Jugador',
            },
            ws
          );
        } else if (data.type === 'call_signal') {
          const { roomId, callId, signal } = data;
          const targetRoom = roomId || `call_${callId}`;
          ensureJoinedCallRoom(targetRoom);
          broadcastToRoom(targetRoom, {
            type: 'call_signal',
            callId,
            signal,
            senderId: currentUserId,
          }, ws);
        } else if (data.type === 'call_frame') {
          const { roomId, callId, frame, role } = data;
          const targetRoom = roomId || `call_${callId}`;
          ensureJoinedCallRoom(targetRoom);
          broadcastToRoom(targetRoom, {
            type: 'call_frame',
            callId,
            frame,
            role,
            senderId: currentUserId,
          }, ws);
        } else if (data.type === 'call_audio') {
          const { roomId, callId, audio, role } = data;
          const targetRoom = roomId || `call_${callId}`;
          ensureJoinedCallRoom(targetRoom);
          broadcastToRoom(targetRoom, {
            type: 'call_audio',
            callId,
            audio,
            role,
            senderId: currentUserId,
          }, ws);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      for (const rId of socketRooms) {
        const room = realtimeRooms.get(rId);
        if (room) {
          room.users.delete(getRoomMemberKey(rId));
          room.users.delete(currentUserId);
          broadcastPresence(rId);
        }
      }
      socketRooms.clear();
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
