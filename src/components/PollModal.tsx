import React, { useState } from 'react';
import { X, BarChart2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { PollData, PollOption } from '../types';

interface PollModalProps {
  isOpen: boolean;
  isNightMode?: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: PollData) => void;
}

export const PollModal: React.FC<PollModalProps> = ({ isOpen, isNightMode = false, onClose, onCreatePoll }) => {
  if (!isOpen) return null;
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError('Por favor escribe la pregunta de la encuesta.');
      return;
    }
    if (validOptions.length < 2) {
      setError('La encuesta debe tener al menos 2 opciones válidas.');
      return;
    }

    const pollOptions: PollOption[] = validOptions.map((opt, idx) => ({
      id: `opt_${Date.now()}_${idx}`,
      text: opt,
      votes: 0,
      voters: [],
    }));

    onCreatePoll({
      question: trimmedQuestion,
      options: pollOptions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-[440px] rounded-3xl p-6 border shadow-2xl flex flex-col gap-5 ${
        isNightMode ? 'bg-[#141822] border-white/10 text-white' : 'bg-white border-sky-200 text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Crear Encuesta</h3>
              <p className="text-[11px] text-[#8d90a0]">Haz una pregunta y recopila votos en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8d90a0]">Pregunta de la encuesta</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿A dónde vamos este fin de semana?"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                isNightMode
                  ? 'bg-[#1c2028] border-white/10 focus:border-blue-500 text-white placeholder:text-neutral-500'
                  : 'bg-sky-50/50 border-sky-200 focus:border-blue-500 text-[#0c2340] placeholder:text-sky-400/70'
              }`}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8d90a0]">Opciones (mínimo 2, máx 6)</label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir opción
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                      isNightMode
                        ? 'bg-[#1c2028] border-white/10 focus:border-blue-500 text-white placeholder:text-neutral-500'
                        : 'bg-sky-50/50 border-sky-200 focus:border-blue-500 text-[#0c2340] placeholder:text-sky-400/70'
                    }`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#8d90a0] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Enviar Encuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
