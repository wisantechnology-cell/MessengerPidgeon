import React, { useState } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Check,
  Wand2,
  Heart,
  Volume2,
  Loader2,
} from 'lucide-react';
import { Chat, ChatPersonalityTheme, EmotionalMode } from '../types';
import { CHAT_PERSONALITY_THEMES, EMOTIONAL_MODES, playThemeSoundEffect } from '../utils/chatThemes';

interface ChatThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  isNightMode?: boolean;
  onSelectGradient: (chatId: string, gradient: string) => void;
  onUpdatePersonalityTheme?: (chatId: string, theme: ChatPersonalityTheme) => void;
  onUpdateEmotionalMode?: (chatId: string, mode: EmotionalMode) => void;
}

export const ChatThemeModal: React.FC<ChatThemeModalProps> = ({
  isOpen,
  onClose,
  chat,
  isNightMode = true,
  onSelectGradient,
  onUpdatePersonalityTheme,
  onUpdateEmotionalMode,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'emotion' | 'ai'>('themes');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTheme: ChatPersonalityTheme =
    chat.personalityTheme ||
    CHAT_PERSONALITY_THEMES.find((t) => t.headerGradient === chat.headerGradient) ||
    CHAT_PERSONALITY_THEMES[0];
  const currentEmotion: EmotionalMode = chat.emotionalMode || 'neutral';

  const applyTheme = (theme: ChatPersonalityTheme) => {
    onSelectGradient(chat.id, theme.headerGradient);
    onUpdatePersonalityTheme?.(chat.id, theme);
    playThemeSoundEffect(theme.soundPack, 'send');
  };

  const handleGenerateAiTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/ai/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.theme) {
          applyTheme(data.theme);
          setStatusMsg(`Tema "${data.theme.name}" aplicado.`);
          setAiPrompt('');
        }
      }
    } catch {
      setStatusMsg('Error al generar tema.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-lg w-full max-h-[88vh] rounded-3xl p-5 border shadow-2xl flex flex-col gap-3.5 overflow-hidden ${
          isNightMode ? 'bg-[#141923] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Personalidad & Modo Emocional</h3>
              <span className="text-xs text-[#8d90a0]">Estilo único para {chat.name}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-black/20 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'themes' ? 'bg-[#0284c7] text-white' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Estilo & Burbujas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emotion')}
            className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'emotion' ? 'bg-[#0284c7] text-white' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Chat Emocional
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-2 rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'ai' ? 'bg-[#0284c7] text-white' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Crear con IA</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {statusMsg && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium">
              {statusMsg}
            </div>
          )}

          {activeTab === 'themes' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHAT_PERSONALITY_THEMES.map((t) => {
                  const isSelected = currentTheme.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTheme(t)}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/15'
                          : 'border-white/10 bg-black/20 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-full h-5 rounded-lg bg-gradient-to-r ${t.headerGradient}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                        <span
                          className="px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: t.bubbleThemBg, color: t.bubbleThemText }}
                        >
                          Hola
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: t.bubbleMeBg, color: t.bubbleMeText }}
                        >
                          ¡Genial!
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fine-tune effects & sounds */}
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 flex flex-col gap-3 mt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">Efecto visual al enviar</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'none', label: 'Ninguno' },
                        { id: 'sparks', label: 'Chispas' },
                        { id: 'hearts', label: 'Corazones' },
                        { id: 'confetti', label: 'Confeti' },
                        { id: 'bubbles', label: 'Burbujas' },
                      ] as const
                    ).map((ef) => (
                      <button
                        key={ef.id}
                        type="button"
                        onClick={() => applyTheme({ ...currentTheme, sendEffect: ef.id })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          (currentTheme.sendEffect || 'none') === ef.id
                            ? 'bg-[#0284c7] text-white'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {ef.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Paquete de sonidos del chat</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'default', label: 'Clásico' },
                        { id: 'cyber', label: 'Futurista' },
                        { id: 'soft', label: 'Suave' },
                        { id: 'retro', label: 'Retro' },
                        { id: 'mute', label: 'Silencio' },
                      ] as const
                    ).map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => applyTheme({ ...currentTheme, soundPack: sp.id })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          (currentTheme.soundPack || 'default') === sp.id
                            ? 'bg-[#0284c7] text-white'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'emotion' && (
            <div className="flex flex-col gap-2.5">
              {EMOTIONAL_MODES.map((mode) => {
                const active = currentEmotion === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      onUpdateEmotionalMode?.(chat.id, mode.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      active
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-white/10 bg-black/20 hover:border-white/25'
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: mode.accentHex }}
                        />
                        <span className="text-sm font-bold">{mode.label}</span>
                      </div>
                      <span className="text-xs text-slate-400">{mode.description}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {mode.reactions.map((r) => (
                          <span key={r.emoji} className="text-base" title={r.label}>
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                    {active && <Check className="w-5 h-5 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'ai' && (
            <form onSubmit={handleGenerateAiTheme} className="flex flex-col gap-3.5">
              <p className="text-xs text-slate-300 leading-relaxed">
                Describe la atmósfera o estilo que quieres para esta conversación y la IA diseñará colores de burbujas, encabezado, efectos visuales y sonido al instante.
              </p>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej. Noche de neón en Tokio, Atardecer romántico en la playa, Bosque mágico..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Diseñando tema...' : 'Generar y Aplicar Tema con IA'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
