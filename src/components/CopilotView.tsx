import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Send,
  Copy,
  Check,
  Briefcase,
  MessageSquare,
  RefreshCw,
  Zap,
  CheckCheck,
  Heart,
  ListOrdered,
  Sliders,
  FileEdit,
  ArrowRight,
} from 'lucide-react';
import { TransformTone } from './DraftTransformerModal';

interface CopilotViewProps {
  onInsertIntoChat?: (text: string) => void;
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
    description: 'Diplomático y pulcro',
    icon: Briefcase,
    color: 'text-[#7bd0ff] bg-[#00a6e0]/15',
  },
  {
    id: 'cv',
    label: 'CV & Portafolio',
    description: 'Postulación con enlaces',
    icon: Zap,
    color: 'text-[#ddb7ff] bg-[#943fe2]/15',
  },
  {
    id: 'casual',
    label: 'Casual & Cercano',
    description: 'Amistoso para chat móvil',
    icon: Sparkles,
    color: 'text-amber-400 bg-amber-400/15',
  },
  {
    id: 'concise',
    label: 'Ultra Conciso',
    description: 'Directo al punto en 1 frase',
    icon: Wand2,
    color: 'text-emerald-400 bg-emerald-400/15',
  },
  {
    id: 'correct',
    label: 'Corregir Ortografía',
    description: 'Puntuación y gramática',
    icon: CheckCheck,
    color: 'text-sky-400 bg-sky-400/15',
  },
  {
    id: 'empathetic',
    label: 'Empático & Cálido',
    description: 'Cálido y comprensivo',
    icon: Heart,
    color: 'text-rose-400 bg-rose-400/15',
  },
  {
    id: 'bullet_points',
    label: 'Viñetas / Lista',
    description: 'Puntos clave claros',
    icon: ListOrdered,
    color: 'text-indigo-400 bg-indigo-400/15',
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Tu indicación libre',
    icon: Sliders,
    color: 'text-fuchsia-400 bg-fuchsia-400/15',
  },
];

const TEMPLATES = [
  {
    title: 'Aceptar Entrevista de Trabajo',
    desc: 'Tono ejecutivo confirmando horario y fecha',
    draft: 'gracias por la oportunidad cuento con total disponibilidad manana despues de las 2 pm',
    tone: 'formal' as TransformTone,
  },
  {
    title: 'Enviar CV y Portafolio Web',
    desc: 'Mensaje con enlaces a proyectos y resumen',
    draft: 'te paso mi portafolio digital y cv actualizado para el rol de disenador',
    tone: 'cv' as TransformTone,
  },
  {
    title: 'Pedir Feedback de Proyecto',
    desc: 'Consulta respetuosa sobre avances de entrega',
    draft: 'pudiste revisar los archivos que te mande ayer quedo atento a tus comentarios',
    tone: 'concise' as TransformTone,
  },
  {
    title: 'Disculpa por Respuesta Tardía',
    desc: 'Explicación amable y disposición inmediata',
    draft: 'disculpa la demora estaba en una reunion importante ya estoy 100% disponible',
    tone: 'empathetic' as TransformTone,
  },
];

export const CopilotView: React.FC<CopilotViewProps> = ({ onInsertIntoChat }) => {
  const [inputText, setInputText] = useState<string>(
    'gracias por la oportunidad de trabajo puedo manana a partir de las 2 pm para reunirnos'
  );
  const [selectedTone, setSelectedTone] = useState<TransformTone>('formal');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [generatedOutput, setGeneratedOutput] = useState<string>(
    'Estimado colega,\n\nLe agradezco sinceramente la recomendación para la vacante en la agencia. Cuento con total disponibilidad este viernes después de las 2:00 PM para la entrevista. Quedo a su entera disposición para coordinar los detalles.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);

  const handleGenerate = async (
    overridePrompt?: string,
    overrideTone?: TransformTone,
    overrideCustom?: string
  ) => {
    setIsLoading(true);
    setInserted(false);

    const activeText = overridePrompt !== undefined ? overridePrompt : inputText;
    const activeTone = overrideTone || selectedTone;
    const activeCustom = overrideCustom !== undefined ? overrideCustom : customInstruction;

    try {
      const res = await fetch('/api/ai/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeText || 'Gracias por la oportunidad de trabajo.',
          tone: activeTone,
          recipient: 'Contacto',
          customInstruction: activeTone === 'custom' ? activeCustom : undefined,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setGeneratedOutput(data.result);
      }
    } catch {
      if (activeTone === 'formal') {
        setGeneratedOutput(
          'Estimado colega,\n\nLe agradezco sinceramente la recomendación para la vacante. Cuento con total disponibilidad este viernes después de las 2:00 PM para la entrevista. Quedo a su entera disposición para cualquier consulta adicional.'
        );
      } else if (activeTone === 'cv') {
        setGeneratedOutput(
          '¡Hola! Te comparto mi portafolio digital actualizado y CV: portfolio.design/bird. Tengo disponibilidad total para coordinar la entrevista.'
        );
      } else {
        setGeneratedOutput(
          `¡Hola! ${activeText} ¡Muchísimas gracias por todo y coordinamos enseguida! 🙌`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (text: string) => {
    if (onInsertIntoChat) {
      onInsertIntoChat(text);
      setInserted(true);
      setTimeout(() => setInserted(false), 2500);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-[#0f131c] text-[#dfe2ee]">
      {/* Header */}
      <header className="sticky top-0 w-full z-40 bg-[#0f131c]/90 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#943fe2] to-[#2563eb] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#dfe2ee] flex items-center gap-1.5">
              <span>IA Copilot & Transformador de Borradores</span>
            </h1>
            <p className="text-[11px] text-[#8d90a0]">
              Redactor y pulidor de mensajes con Inteligencia Artificial
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#943fe2]/20 text-[#ddb7ff] text-[10px] font-bold border border-[#943fe2]/30">
          Modo IA
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-4 pb-28 flex flex-col gap-4 overflow-y-auto">
        {/* Quick Templates */}
        <section className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#8d90a0] uppercase tracking-wider">
            Plantillas Rápidas con 1 Toque
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(tmpl.draft);
                  setSelectedTone(tmpl.tone);
                  handleGenerate(tmpl.draft, tmpl.tone);
                }}
                className="p-3 bg-[#1c2028] hover:bg-[#262a33] rounded-2xl text-left border border-white/5 hover:border-[#38bdf8]/30 transition-all group active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#7bd0ff] transition-colors">
                    {tmpl.title}
                  </span>
                  <Wand2 className="w-3.5 h-3.5 text-[#ddb7ff] opacity-75 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[11px] text-[#8d90a0] block leading-tight">{tmpl.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Transformer Box */}
        <section className="bg-[#1c2028] rounded-3xl p-4 sm:p-5 border border-white/5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-[#7bd0ff]" />
              <span className="text-xs font-bold text-[#dfe2ee]">
                Tu borrador o idea en palabras simples:
              </span>
            </div>
            {inputText.length > 0 && (
              <span className="text-[10px] text-[#8d90a0]">{inputText.length} caracteres</span>
            )}
          </div>

          <textarea
            rows={3}
            placeholder="Escribe lo que deseas comunicar (ej: 'gracias por la recomendacion, puedo el viernes despues de almorzar')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-[#121620] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] p-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
          />

          {/* Tone Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ddb7ff]" />
              <span>Selecciona el tono de redacción:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTone(t.id);
                      if (inputText.trim()) {
                        handleGenerate(inputText, t.id);
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

          {/* Custom instruction */}
          {selectedTone === 'custom' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#121620] border border-white/10 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-[#f0dbff] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#ddb7ff]" />
                <span>Instrucción específica para la IA:</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Ej: 'Hazlo sonar como un mensaje de WhatsApp rápido con emojis', 'Traduce a inglés'..."
                  className="flex-1 bg-[#181d28] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#943fe2]"
                />
                <button
                  onClick={() => handleGenerate(inputText, 'custom', customInstruction)}
                  disabled={!customInstruction.trim() || isLoading}
                  className="px-3 py-2 rounded-xl bg-[#943fe2] hover:bg-[#8326d9] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#943fe2] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transformando borrador con Inteligencia Artificial...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Transformar Borrador con IA</span>
              </>
            )}
          </button>
        </section>

        {/* Output Box */}
        <section className="bg-gradient-to-br from-[#1b1f2b] to-[#121620] rounded-3xl p-4 sm:p-5 border border-[#943fe2]/30 flex flex-col gap-3 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#7bd0ff]" />
              <span className="text-xs font-bold text-[#ddb7ff]">
                Mensaje Transformado Listo para Enviar
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7bd0ff] hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-[#0a0d14] rounded-2xl text-sm leading-relaxed text-[#dfe2ee] border border-white/5 font-sans whitespace-pre-wrap select-text">
            {generatedOutput}
          </div>

          {onInsertIntoChat && (
            <button
              onClick={() => handleInsert(generatedOutput)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950/40 transition-all active:scale-98 cursor-pointer"
            >
              {inserted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Mensaje insertado en el chat con éxito!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Insertar directamente en el chat</span>
                </>
              )}
            </button>
          )}
        </section>
      </main>
    </div>
  );
};
