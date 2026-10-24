import React from 'react';
import { BarChart2, CheckCircle2 } from 'lucide-react';
import { PollData } from '../types';

interface PollMessageViewProps {
  pollData: PollData;
  isSender: boolean;
  onVote: (optionId: string) => void;
  isNightMode?: boolean;
}

export const PollMessageView: React.FC<PollMessageViewProps> = ({
  pollData,
  isSender,
  onVote,
  isNightMode = false,
}) => {
  const totalVotes = pollData.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return (
    <div className="flex flex-col gap-3 min-w-[240px] max-w-[280px]">
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-xs font-bold leading-tight">{pollData.question}</span>
      </div>

      <div className="flex flex-col gap-2">
        {pollData.options.map((opt) => {
          const votes = opt.votes || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const hasVoted = opt.voters?.includes('me');

          return (
            <button
              key={opt.id}
              onClick={() => onVote(opt.id)}
              className={`relative overflow-hidden p-2.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer ${
                hasVoted
                  ? 'border-blue-500 bg-blue-500/20 text-white'
                  : 'border-white/10 bg-black/20 hover:border-white/30 text-gray-200'
              }`}
            >
              {/* Progress bar fill */}
              <div
                className="absolute inset-y-0 left-0 bg-blue-600/30 transition-all duration-500 pointer-events-none"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold truncate">{opt.text}</span>
                <span className="text-[11px] font-mono font-bold shrink-0">{percentage}%</span>
              </div>
              <span className="relative z-10 text-[10px] text-gray-400">
                {votes} {votes === 1 ? 'voto' : 'votos'}
              </span>
            </button>
          );
        })}
      </div>

      <span className="text-[10px] text-gray-400 text-right font-mono">
        Total: {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
      </span>
    </div>
  );
};
