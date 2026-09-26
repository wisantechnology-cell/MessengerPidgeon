import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Send,
  Copy,
  Check,
  Briefcase,
  Zap,
  CheckCheck,
  Heart,
  ListOrdered,
  FileEdit,
  RefreshCw,
  X,
  ArrowRight,
  Sliders,
  MessageSquare,
} from 'lucide-react';

export type TransformTone =
  | 'formal'
  | 'cv'
  | 'casual'
  | 'concise'
  | 'correct'
  | 'persuasive'
  | 'empathetic'
  | 'bullet_points'
  | 'custom';

interface DraftTransformerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: string;
  recipientName?: string;
  onApplyDraft: (transformedText: string) => void;
  onSendDirectly?: (transformedText: string) => void;
}

interface ToneOption {
  id: TransformTone;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const TONES: ToneOption[] = [
  {
    id: 'formal',
    label: 'Formal / Ejecutivo',
    description: 'Diplomático, profesional y elocuente',
    icon: Briefcase,
    color: 'text-[#7bd0ff] bg-[#00a6e0]/15 border-[#00a6e0]/30',
  },
  {
    id: 'cv',
    label: 'CV & Portafolio',
    description: 'Postulación laboral con enlaces y llamada a acción',
    icon: Zap,
    color: 'text-[#ddb7ff] bg-[#943fe2]/15 border-[#943fe2]/30',
  },
  {
    id: 'casual',
    label: 'Casual & Cercano',
    description: 'Amistoso, fresco y relajado para chat móvil',
    icon: Sparkles,
    color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
  },
  {
    id: 'concise',
    label: 'Ultra Conciso',
    description: 'Directo al grano sin rodeos innecesarios',
    icon: Wand2,
    color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',
  },
  {
    id: 'correct',
    label: 'Corregir Ortografía',
    description: 'Corrige puntuación y tildes sin cambiar el texto',
    icon: CheckCheck,
    color: 'text-sky-400 bg-sky-400/15 border-sky-400/30',
  },
  {
    id: 'empathetic',
    label: 'Empático & Cálido',
    description: 'Amable, comprensivo y agradecido',
    icon: Heart,
    color: 'text-rose-400 bg-rose-400/15 border-rose-400/30',
  },
  {
    id: 'bullet_points',
    label: 'Viñetas / Lista',
    description: 'Estructurado en puntos clave fáciles de leer',
    icon: ListOrdered,
    color: 'text-indigo-400 bg-indigo-400/15 border-indigo-400/30',
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Escribe tu propia indicación para la IA',
    icon: Sliders,
    color: 'text-fuchsia-400 bg-fuchsia-400/15 border-fuchsia-400/30',
  },
];

const QUICK_DRAFTS = [
  {
    label: 'Confirmar entrevista',
    text: 'gracias por la oportunidad puedo el viernes despues de las dos de la tarde para la entrevista',
    tone: 'formal' as TransformTone,
  },
  {
    label: 'Compartir portafolio',
    text: 'hola te paso mi cv y portafolio actualizado para que lo mires avísame cualquier duda',
    tone: 'cv' as TransformTone,
  },
  {
    label: 'Disculpa por demora',
    text: 'perdon la tardanza en contestar estaba en una llamada importante ya estoy disponible',
    tone: 'empathetic' as TransformTone,
  },
  {
    label: 'Pedir feedback',
    text: 'pudiste ver los diseños que mande ayer dime que te parecieron para hacer cambios',
    tone: 'concise' as TransformTone,
  },
];

export const DraftTransformerModal: React.FC<DraftTransformerModalProps> = ({
  isOpen,
  onClose,
  initialDraft = '',
  recipientName = 'Contacto',
  onApplyDraft,
  onSendDirectly,
}) => {
  const [draft, setDraft] = useState<string>(initialDraft);
  const [selectedTone, setSelectedTone] = useState<TransformTone>('formal');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [transformedOutput, setTransformedOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      const activeInitial = initialDraft.trim();
      setDraft(activeInitial);
      if (activeInitial) {
        // Auto trigger initial transform
        transformDraft(activeInitial, selectedTone, customInstruction);
      } else {
        setTransformedOutput('');
      }
    }
  }, [isOpen, initialDraft]);

  if (!isOpen) return null;

  const transformDraft = async (
    textToTransform?: string,
    toneToUse?: TransformTone,
    customInst?: string
  ) => {
    const activeText = textToTransform !== undefined ? textToTransform : draft;
    const activeTone = toneToUse || selectedTone;
    const activeCustom = customInst !== undefined ? customInst : customInstruction;

    if (!activeText.trim()) {
      setTransformedOutput('');
      return;
    }

    setIsLoading(true);
    setApplied(false);

    try {
      const res = await fetch('/api/ai/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeText,
          tone: activeTone,
          recipient: recipientName,
          customInstruction: activeTone === 'custom' ? activeCustom : undefined,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setTransformedOutput(data.result);
      }
    } catch {
      // Fallback
      if (activeTone === 'formal') {
        setTransformedOutput(
          `Estimado/a ${recipientName},\n\nLe escribo para informarle lo siguiente: ${activeText}. Quedo atento/a a sus comentarios y a su entera disposición.`
        );
      } else if (activeTone === 'cv') {
        setTransformedOutput(
          `¡Hola ${recipientName}! Te comparto la información solicitada: ${activeText}. Puedes consultar mi CV y portafolio actualizado en cualquier momento.`
        );
      } else {
        setTransformedOutput(`¡Hola ${recipientName}! ${activeText} ¡Seguimos en contacto! 🙌`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!transformedOutput) return;
    navigator.clipboard.writeText(transformedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    const finalResult = transformedOutput || draft;
    onApplyDraft(finalResult);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSend = () => {
    const finalResult = transformedOutput || draft;
    if (onSendDirectly) {
      onSendDirectly(finalResult);
      onClose();
    } else {
      handleApply();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#141822] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181d28]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#943fe2] to-[#2563eb] text-white flex items-center justify-center shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#dfe2ee]">
                  Transformador de Borradores IA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#943fe2]/20 text-[#ddb7ff] text-[10px] font-bold border border-[#943fe2]/30">
                  Modo IA Activo
                </span>
              </div>
              <p className="text-[11px] text-[#8d90a0]">
                Escribe una idea en borrador y la IA la transformará al tono perfecto para {recipientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Quick Draft Templates */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#8d90a0] uppercase tracking-wider">
              Ideas rápidas para empezar
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_DRAFTS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDraft(q.text);
                    setSelectedTone(q.tone);
                    transformDraft(q.text, q.tone);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1c212c] hover:bg-[#262c3a] text-xs text-[#dfe2ee] border border-white/5 whitespace-nowrap transition-colors flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-[#ddb7ff]" />
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Input Section (Draft) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#7bd0ff]" />
                <span>Tu borrador original:</span>
              </label>
              {draft.length > 0 && (
                <span className="text-[10px] text-[#8d90a0]">{draft.length} caracteres</span>
              )}
            </div>
            <textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Escribe lo que deseas decir en palabras simples... (ej: 'gracias por la recomendacion, puedo el viernes despues de almorzar')`}
              className="w-full bg-[#0d1017] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] p-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
            />
          </div>

          {/* Tone Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ddb7ff]" />
              <span>Elige el tono de transformación:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTone(t.id);
                      if (draft.trim()) {
                        transformDraft(draft, t.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563eb]/20 border-[#38bdf8] ring-1 ring-[#38bdf8]/50 shadow-md scale-[1.02]'
                        : 'bg-[#181d28] border-white/5 hover:border-white/15 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.color}`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#2563eb] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#dfe2ee] leading-tight mt-0.5">
                      {t.label}
                    </span>
                    <span className="text-[10px] text-[#8d90a0] leading-tight line-clamp-1">
                      {t.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom instruction field when custom mode is chosen */}
          {selectedTone === 'custom' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#1c212c] border border-white/10 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-[#f0dbff] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#ddb7ff]" />
                <span>Instrucción específica para la IA:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Ej: 'Hazlo sonar como un mensaje de WhatsApp rápido con emojis', 'Traduce a inglés'..."
                  className="flex-1 bg-[#0d1017] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#943fe2]"
                />
                <button
                  onClick={() => transformDraft(draft, 'custom', customInstruction)}
                  disabled={!customInstruction.trim() || isLoading}
                  className="px-3 py-2 rounded-xl bg-[#943fe2] hover:bg-[#8326d9] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </button>
              </div>
            </div>
          )}

          {/* Action to trigger / refresh transform */}
          <button
            onClick={() => transformDraft()}
            disabled={isLoading || !draft.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#943fe2] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transformando borrador con IA...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>
                  {transformedOutput ? 'Re-transformar / Probar otra variante' : 'Transformar Borrador con IA'}
                </span>
              </>
            )}
          </button>

          {/* Output Box */}
          {transformedOutput && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-gradient-to-br from-[#1b1f2b] to-[#121620] border border-[#943fe2]/30 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#7bd0ff]" />
                  <span className="text-xs font-bold text-[#ddb7ff]">
                    Resultado Transformado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#7bd0ff] hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#0a0d14] rounded-xl text-sm leading-relaxed text-[#dfe2ee] font-sans border border-white/5 whitespace-pre-wrap select-text">
                {transformedOutput}
              </div>

              {/* Action Buttons to apply/send */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleApply}
                  className="py-2.5 px-3 rounded-xl bg-[#262c3a] hover:bg-[#313849] text-[#dfe2ee] text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-98 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-[#7bd0ff]" />
                  <span>{applied ? '¡Aplicado al chat!' : 'Insertar en caja de texto'}</span>
                </button>

                <button
                  onClick={handleSend}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/50 transition-all active:scale-98 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar directo a {recipientName}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
