import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Gamepad2,
  Trophy,
  Users,
  Brain,
  Pencil,
  Flame,
  Sparkles,
  Send,
  RotateCcw,
  Trash2,
  Check,
  ArrowRight,
  Clock,
  HelpCircle,
  Play,
  Crown,
} from 'lucide-react';
import {
  Chat,
  UserProfile,
  GroupGameState,
  GroupGameType,
  DrawStroke,
} from '../types';
import { realtimeClient } from '../services/realtimeClient';
import { db, doc, setDoc } from '../firebase';

interface GroupGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  user: UserProfile;
  isNightMode?: boolean;
  initialGameType?: GroupGameType | null;
  onSendGameInviteToChat?: (
    gameType: 'trivia' | 'draw' | 'truth_dare',
    title: string,
    summary?: string,
    gameId?: string
  ) => void;
}

const DRAW_COLORS = [
  '#111827',
  '#2563eb',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#ffffff',
];

export const GroupGamesModal: React.FC<GroupGamesModalProps> = ({
  isOpen,
  onClose,
  chat,
  user,
  isNightMode = true,
  initialGameType = null,
  onSendGameInviteToChat,
}) => {
  const [gameState, setGameState] = useState<GroupGameState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTriviaRounds, setSelectedTriviaRounds] = useState<number>(5);
  const [triviaTimeLeft, setTriviaTimeLeft] = useState<number>(15);
  const [guessInput, setGuessInput] = useState<string>('');
  const [customPromptInput, setCustomPromptInput] = useState<string>('');
  const [isSpinningWheel, setIsSpinningWheel] = useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const [brushColor, setBrushColor] = useState<string>('#2563eb');
  const [brushWidth, setBrushWidth] = useState<number>(5);

  const actorRef = useRef({
    id: user.id || 'me',
    name: user.name || 'Jugador',
    avatarUrl: user.avatarUrl || '',
    phone: user.phone || '',
  });
  actorRef.current = {
    id: user.id || 'me',
    name: user.name || 'Jugador',
    avatarUrl: user.avatarUrl || '',
    phone: user.phone || '',
  };

  const syncSummaryToFirestore = useCallback(
    (gs: GroupGameState | null) => {
      try {
        setDoc(
          doc(db, 'chats', chat.id),
          {
            activeGroupGame: gs
              ? {
                  gameId: gs.gameId,
                  gameType: gs.gameType,
                  title: gs.title,
                  hostName: gs.hostName,
                  status: gs.status,
                  playerCount: (gs.players || []).length,
                  updatedAt: gs.updatedAt,
                }
              : null,
          },
          { merge: true }
        ).catch(() => {});
      } catch {}
    },
    [chat.id]
  );

  const dispatchAction = useCallback(
    async (action: string, payload: Record<string, any> = {}) => {
      try {
        const res = await fetch(`/api/group-games/${encodeURIComponent(chat.id)}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor: actorRef.current,
            action,
            payload,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.gameState) {
            setGameState(data.gameState);
            if (
              action === 'START_GAME' ||
              action === 'END_GAME' ||
              action === 'JOIN_GAME' ||
              action === 'TRIVIA_NEXT_ROUND' ||
              action === 'DRAW_NEXT_TURN'
            ) {
              syncSummaryToFirestore(data.gameState);
            }
            return data.gameState as GroupGameState;
          }
        }
      } catch (err) {
        console.warn('Error dispatching group game action:', err);
      }
      return null;
    },
    [chat.id, syncSummaryToFirestore]
  );

  // Join room & load current server game state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    realtimeClient.ensureConnected(user);
    realtimeClient.joinRoom(chat.id);

    const loadCurrentState = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/group-games/${encodeURIComponent(chat.id)}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data?.gameState) {
            setGameState(data.gameState);
            if (
              data.gameState.status === 'active' &&
              !(data.gameState.players || []).some((p: any) => p.id === actorRef.current.id)
            ) {
              dispatchAction('JOIN_GAME');
            }
          } else {
            setGameState(null);
          }
        }
      } catch {}
      if (active) setLoading(false);
    };

    loadCurrentState();

    const unsub = realtimeClient.subscribeGame((roomId, event) => {
      if (!active || roomId !== chat.id) return;
      if (event?.gameState) {
        setGameState(event.gameState);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [isOpen, chat.id, user, dispatchAction]);

  // Auto-launch requested game type if no active game exists
  const autoLaunchedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) {
      autoLaunchedRef.current = null;
      return;
    }
    if (
      initialGameType &&
      !loading &&
      !gameState &&
      autoLaunchedRef.current !== `${chat.id}_${initialGameType}`
    ) {
      autoLaunchedRef.current = `${chat.id}_${initialGameType}`;
      handleStartGame(initialGameType);
    }
  }, [isOpen, initialGameType, loading, gameState, chat.id]);

  // Countdown timer for active Trivia round
  useEffect(() => {
    if (!isOpen || gameState?.gameType !== 'trivia' || gameState?.status !== 'active') return;
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - (gameState.roundStartedAt || Date.now())) / 1000);
      setTriviaTimeLeft(Math.max(0, 15 - elapsed));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [isOpen, gameState?.gameType, gameState?.status, gameState?.round, gameState?.roundStartedAt]);

  // Render drawing strokes on canvas
  const redrawCanvas = useCallback((strokes: DrawStroke[] = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach((stroke) => {
      if (!stroke?.points || stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color || '#111827';
      ctx.lineWidth = stroke.width || 4;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
      }
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    if (gameState?.gameType === 'draw') {
      redrawCanvas(gameState.strokes || []);
    }
  }, [gameState?.gameType, gameState?.strokes, redrawCanvas]);

  const handleStartGame = async (gameType: GroupGameType) => {
    const seedPlayers = (chat.groupMembers || [])
      .filter((m) => m.id && m.id !== 'me')
      .slice(0, 12)
      .map((m) => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl,
        phone: m.phone || '',
      }));

    const created = await dispatchAction('START_GAME', {
      gameType,
      totalRounds: selectedTriviaRounds,
      seedPlayers,
    });

    if (created && onSendGameInviteToChat) {
      const titles: Record<GroupGameType, string> = {
        trivia: 'Trivia Grupal en Vivo',
        draw: 'Dibuja y Adivina Grupal',
        truth_dare: 'Verdad o Reto Grupal',
      };
      onSendGameInviteToChat(
        gameType,
        `🎮 ${user.name} inició: ${titles[gameType]}`,
        `¡Únete ahora en "${chat.name}"!`,
        created.gameId
      );
    }
  };

  // Canvas pointer helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      gameState?.gameType !== 'draw' ||
      gameState.status !== 'active' ||
      gameState.drawerId !== actorRef.current.id
    ) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    currentStrokeRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasPoint(e);
    const pts = currentStrokeRef.current;
    const prevPt = pts[pts.length - 1];
    pts.push(pt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && prevPt) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prevPt.x, prevPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = [...currentStrokeRef.current];
    currentStrokeRef.current = [];
    if (points.length > 0) {
      dispatchAction('DRAW_STROKE', {
        stroke: { points, color: brushColor, width: brushWidth },
      });
    }
  };

  const handleSendGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    const text = guessInput.trim();
    setGuessInput('');
    await dispatchAction('DRAW_GUESS', { text });
  };

  const handleSpinWheel = async () => {
    setIsSpinningWheel(true);
    setTimeout(async () => {
      await dispatchAction('SPIN_WHEEL');
      setIsSpinningWheel(false);
    }, 650);
  };

  if (!isOpen) return null;

  const sortedPlayers = [...(gameState?.players || [])].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );
  const myId = actorRef.current.id;
  const isJoined = Boolean((gameState?.players || []).some((p) => p.id === myId));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden ${
          isNightMode
            ? 'bg-[#121722] border-white/10 text-[#eef2f8]'
            : 'bg-white border-sky-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isNightMode ? 'bg-[#171d2b] border-white/10' : 'bg-sky-50 border-sky-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white flex items-center justify-center shadow-lg shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold truncate">
                  {gameState ? gameState.title : `Juegos Grupales · ${chat.name}`}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                  En Vivo
                </span>
              </div>
              <p className={`text-[11px] truncate ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                {gameState
                  ? `${gameState.players.length} jugadores en partida · Sincronización en tiempo real`
                  : 'Compite y diviértete con todos los integrantes del grupo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {gameState && (
              <button
                type="button"
                onClick={async () => {
                  await dispatchAction('END_GAME');
                  setGameState(null);
                  syncSummaryToFirestore(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                title="Cambiar de juego"
              >
                Menú
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {!gameState ? (
            <>
              {/* Game Picker Hub */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isNightMode ? 'bg-[#192030] border-white/10' : 'bg-sky-50 border-sky-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Users className="w-5 h-5 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      Sala lista para {chat.groupMembers?.length || 2} integrantes
                    </div>
                    <div className={`text-[11px] ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                      Al iniciar un juego se enviará una invitación automática al chat para que todos se unan.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Trivia Card */}
                <div
                  className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                    isNightMode ? 'bg-[#171e2d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm">Trivia Grupal</h3>
                    <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                      Preguntas rápidas con reloj. ¡El más rápido y certero gana más puntos!
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[3, 5, 8].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSelectedTriviaRounds(n)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                            selectedTriviaRounds === n
                              ? 'bg-sky-600 text-white border-sky-400'
                              : isNightMode
                              ? 'bg-white/5 border-white/10 text-[#94a3b8]'
                              : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          {n} preg.
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartGame('trivia')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Trivia</span>
                  </button>
                </div>

                {/* Draw & Guess Card */}
                <div
                  className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                    isNightMode ? 'bg-[#171e2d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow">
                      <Pencil className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm">Dibuja y Adivina</h3>
                    <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                      Uno dibuja la palabra secreta en tiempo real y el resto del grupo intenta adivinarla.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartGame('draw')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Pictionary</span>
                  </button>
                </div>

                {/* Truth or Dare Card */}
                <div
                  className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                    isNightMode ? 'bg-[#171e2d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-600 text-white flex items-center justify-center shadow">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm">Verdad o Reto</h3>
                    <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                      Gira la ruleta entre todos los amigos del grupo y cumple retos en vivo para sumar puntos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartGame('truth_dare')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Ruleta</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Live Players Leaderboard Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {!isJoined && (
                  <button
                    type="button"
                    onClick={() => dispatchAction('JOIN_GAME')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    + Unirme
                  </button>
                )}
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 ${
                      p.id === myId
                        ? 'bg-sky-500/20 border-sky-400/50'
                        : isNightMode
                        ? 'bg-white/5 border-white/10'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {idx === 0 && (p.score || 0) > 0 && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-bold max-w-[90px] truncate">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {p.score || 0} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* FINISHED PODIUM SCREEN */}
              {gameState.status === 'finished' && (
                <div
                  className={`p-6 rounded-3xl border text-center flex flex-col items-center gap-4 ${
                    isNightMode ? 'bg-[#181f30] border-amber-400/30' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <Trophy className="w-12 h-12 text-amber-400" />
                  <div>
                    <h3 className="text-lg font-black">¡Partida Finalizada!</h3>
                    {sortedPlayers[0] && (
                      <p className="text-sm font-semibold text-emerald-400 mt-1">
                        🏆 Ganador: {sortedPlayers[0].name} ({sortedPlayers[0].score} pts)
                      </p>
                    )}
                  </div>
                  <div className="w-full max-w-sm flex flex-col gap-2">
                    {sortedPlayers.map((p, i) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl border ${
                          isNightMode ? 'bg-white/5 border-white/10' : 'bg-white border-amber-200'
                        }`}
                      >
                        <span className="text-xs font-bold">
                          #{i + 1} · {p.name}
                        </span>
                        <span className="text-xs font-black text-sky-400">{p.score} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSendGameInviteToChat && sortedPlayers[0]) {
                          onSendGameInviteToChat(
                            gameState.gameType,
                            `🏆 Resultado: ${gameState.title}`,
                            `Ganador: ${sortedPlayers[0].name} con ${sortedPlayers[0].score} puntos`,
                            gameState.gameId
                          );
                        }
                        handleStartGame(gameState.gameType);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Jugar Otra Vez
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGameState(null);
                        syncSummaryToFirestore(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                    >
                      Elegir Otro
                    </button>
                  </div>
                </div>
              )}

              {/* GAME 1: TRIVIA GRUPAL */}
              {gameState.gameType === 'trivia' && gameState.status === 'active' && (() => {
                const q = gameState.triviaQuestions?.[gameState.round];
                const roundAnswers = gameState.triviaAnswers?.[gameState.round] || {};
                const myAnswer = roundAnswers[myId];
                const answeredCount = Object.keys(roundAnswers).length;
                if (!q) return null;

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold">
                        Pregunta {gameState.round + 1} / {gameState.totalRounds} · {q.category}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg ${
                          triviaTimeLeft <= 5
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{triviaTimeLeft}s</span>
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border ${
                        isNightMode ? 'bg-[#182032] border-white/10' : 'bg-sky-50 border-sky-200'
                      }`}
                    >
                      <h3 className="text-sm sm:text-base font-bold leading-snug">{q.question}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isSelected = myAnswer?.optionIndex === idx;
                        const reveal = Boolean(myAnswer) || triviaTimeLeft === 0;
                        const isRight = idx === q.correctIndex;

                        let btnCls = isNightMode
                          ? 'bg-[#1a2234] hover:bg-[#232d45] border-white/10 text-white'
                          : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-900';

                        if (reveal) {
                          if (isRight) {
                            btnCls = 'bg-emerald-600 border-emerald-400 text-white';
                          } else if (isSelected && !isRight) {
                            btnCls = 'bg-red-600 border-red-400 text-white';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={Boolean(myAnswer)}
                            onClick={() =>
                              dispatchAction('TRIVIA_ANSWER', {
                                round: gameState.round,
                                optionIndex: idx,
                              })
                            }
                            className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${btnCls}`}
                          >
                            <span>
                              <strong className="mr-1.5">{['A', 'B', 'C', 'D'][idx]}.</strong>
                              {opt}
                            </span>
                            {reveal && isRight && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className={`text-[11px] ${isNightMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                        {answeredCount} respuesta(s) registrada(s) en esta ronda
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatchAction('TRIVIA_NEXT_ROUND')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>
                          {gameState.round + 1 >= gameState.totalRounds
                            ? 'Ver Podio Final'
                            : 'Siguiente Pregunta'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* GAME 2: DIBUJA Y ADIVINA */}
              {gameState.gameType === 'draw' && gameState.status === 'active' && (() => {
                const amIDrawer = gameState.drawerId === myId;
                return (
                  <div className="flex flex-col gap-3">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                        isNightMode ? 'bg-[#182032] border-white/10' : 'bg-sky-50 border-sky-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Pencil className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold truncate">
                          {amIDrawer
                            ? `Tu palabra secreta: `
                            : `Dibuja ${gameState.drawerName}: `}
                          <strong className="text-amber-400 tracking-wider text-sm">
                            {amIDrawer ? gameState.secretWord : gameState.maskedWord}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatchAction('DRAW_NEXT_TURN')}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Siguiente Turno
                      </button>
                    </div>

                    {/* Drawing Canvas */}
                    <div className="rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-white shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={560}
                        height={300}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className={`w-full h-[220px] sm:h-[260px] touch-none block ${
                          amIDrawer ? 'cursor-crosshair' : 'cursor-default'
                        }`}
                      />
                    </div>

                    {/* Drawer Controls */}
                    {amIDrawer && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {DRAW_COLORS.map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setBrushColor(col)}
                              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                                brushColor === col ? 'scale-125 border-sky-400' : 'border-white/30'
                              }`}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[3, 6, 12].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setBrushWidth(w)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                                brushWidth === w
                                  ? 'bg-sky-600 text-white border-sky-400'
                                  : 'bg-white/10 border-white/10'
                              }`}
                            >
                              {w === 3 ? 'Fino' : w === 6 ? 'Medio' : 'Grueso'}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => dispatchAction('DRAW_CLEAR')}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Limpiar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Guesses Feed & Input */}
                    <div
                      className={`rounded-2xl border p-3 flex flex-col gap-2 ${
                        isNightMode ? 'bg-[#161d2b] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="max-h-24 overflow-y-auto flex flex-col gap-1">
                        {(gameState.guesses || []).length === 0 ? (
                          <span className="text-[11px] opacity-60">
                            {amIDrawer
                              ? 'Tus amigos intentarán adivinar tu dibujo aquí...'
                              : 'Escribe la palabra que crees que está dibujando...'}
                          </span>
                        ) : (
                          (gameState.guesses || []).map((g) => (
                            <div
                              key={g.id}
                              className={`text-xs ${
                                g.isCorrect ? 'text-emerald-400 font-bold' : ''
                              }`}
                            >
                              <strong>{g.userName}:</strong> {g.text}
                            </div>
                          ))
                        )}
                      </div>

                      {!amIDrawer && (
                        <form onSubmit={handleSendGuess} className="flex gap-2">
                          <input
                            type="text"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            placeholder="Escribe tu respuesta aquí..."
                            className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                              isNightMode
                                ? 'bg-[#0f131c] border-white/10 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Adivinar</span>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* GAME 3: VERDAD O RETO GRUPAL */}
              {gameState.gameType === 'truth_dare' && gameState.status === 'active' && (
                <div className="flex flex-col gap-3">
                  <div
                    className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 ${
                      isNightMode
                        ? 'bg-gradient-to-br from-[#1b2234] to-[#151a28] border-orange-500/30'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Turno Actual</span>
                    </div>

                    <div
                      className={`text-xl font-black transition-transform ${
                        isSpinningWheel ? 'scale-110 animate-pulse text-amber-400' : ''
                      }`}
                    >
                      {isSpinningWheel
                        ? '🎲 Girando ruleta...'
                        : gameState.selectedPlayerName || 'Jugador'}
                    </div>

                    <button
                      type="button"
                      disabled={isSpinningWheel}
                      onClick={handleSpinWheel}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSpinningWheel ? 'animate-spin' : ''}`} />
                      <span>Girar Ruleta de Jugadores</span>
                    </button>

                    {!gameState.truthOrDarePrompt ? (
                      <div className="w-full flex flex-col gap-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              dispatchAction('PICK_TRUTH_DARE', {
                                mode: 'truth',
                                customPrompt: customPromptInput.trim() || undefined,
                              })
                            }
                            className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>Verdad</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              dispatchAction('PICK_TRUTH_DARE', {
                                mode: 'dare',
                                customPrompt: customPromptInput.trim() || undefined,
                              })
                            }
                            className="py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Flame className="w-4 h-4" />
                            <span>Reto</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={customPromptInput}
                          onChange={(e) => setCustomPromptInput(e.target.value)}
                          placeholder="Opcional: escribe tu propia pregunta o reto..."
                          className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                            isNightMode
                              ? 'bg-[#0f131c] border-white/10 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-full p-4 rounded-2xl border flex flex-col gap-3 mt-1 ${
                          gameState.truthOrDareMode === 'truth'
                            ? 'bg-blue-950/50 border-blue-400/40 text-white'
                            : 'bg-orange-950/50 border-orange-400/40 text-white'
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                          {gameState.truthOrDareMode === 'truth' ? 'Verdad' : 'Reto'} para{' '}
                          {gameState.selectedPlayerName}
                        </span>
                        <p className="text-sm font-bold leading-relaxed">
                          "{gameState.truthOrDarePrompt}"
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPromptInput('');
                              dispatchAction('COMPLETE_TRUTH_DARE', { completed: true });
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                          >
                            ✓ ¡Cumplido! (+50 pts)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPromptInput('');
                              dispatchAction('COMPLETE_TRUTH_DARE', { completed: false });
                            }}
                            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                          >
                            Pasar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {(gameState.truthOrDareHistory || []).length > 0 && (
                    <div
                      className={`rounded-2xl border p-3 flex flex-col gap-1.5 max-h-28 overflow-y-auto ${
                        isNightMode ? 'bg-[#161d2b] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase opacity-60">Historial reciente</span>
                      {(gameState.truthOrDareHistory || []).map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between gap-2">
                          <span className="truncate">
                            <strong>{item.playerName}</strong> ({item.mode === 'truth' ? 'Verdad' : 'Reto'}):{' '}
                            {item.prompt}
                          </span>
                          <span
                            className={`text-[10px] font-bold shrink-0 ${
                              item.completed ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {item.completed ? '+50 pts' : 'Pasó'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
