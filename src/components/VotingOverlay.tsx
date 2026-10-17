import React, { useState } from 'react';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';

interface Candidate {
  userId: string;
  displayName: string;
  avatarId: string;
  avatarBg: string;
}

interface VotingOverlayProps {
  candidates: Candidate[];
  myUserId: string;
  isOwner: boolean;
  timeLeftSeconds: number;
  totalDurationSeconds: number;
  isClutch: boolean;
  onCastVote: (votedUserId: string) => void;
}

export const VotingOverlay: React.FC<VotingOverlayProps> = ({
  candidates,
  myUserId,
  isOwner,
  timeLeftSeconds,
  totalDurationSeconds,
  isClutch,
  onCastVote,
}) => {
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);

  const handleVoteClick = (candidateId: string) => {
    if (selectedVoteId) return; // Już zagłosowano
    setSelectedVoteId(candidateId);
    onCastVote(candidateId);
  };

  // Pokaż wszystkich graczy poza sobą (do głosowania)
  const voteableCandidates = candidates.filter((c) => c.userId !== myUserId);

  const progressPercent = Math.max(0, Math.min(100, (timeLeftSeconds / totalDurationSeconds) * 100));

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
      {/* Pasek postępu czasu */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
          <span>KTO POLUBIŁ TEN FILM?</span>
          <span className={`${timeLeftSeconds <= 5 ? 'text-rose-400 animate-pulse font-black' : 'text-emerald-400'}`}>
            {timeLeftSeconds}s
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-linear rounded-full ${
              timeLeftSeconds <= 5 ? 'bg-rose-500' : isClutch ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Dyskretna informacja dla właściciela filmu (Poker Face) */}
      {isOwner && (
        <div className="w-full bg-violet-950/40 border border-violet-500/30 rounded-2xl p-3 flex items-center gap-3 animate-fade-in shadow-lg">
          <div className="text-2xl">🤫</div>
          <div className="flex-1 text-left">
            <div className="text-xs font-black text-violet-300 uppercase tracking-wide">
              To Twój polubiony film!
            </div>
            <div className="text-[11px] text-slate-300">
              Zachowaj pokerową twarz. Jeśli nikt Cię nie zgadnie, zgarniasz <strong>Bonus Niewidzialności</strong>!
              (Możesz klikać dla zmyłki).
            </div>
          </div>
        </div>
      )}

      {/* Przyciski kandydatów do wyboru */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {voteableCandidates.map((candidate) => {
          const isSelected = selectedVoteId === candidate.userId;
          const preset = AVATAR_PRESETS.find((p) => p.id === candidate.avatarId);
          const isCustomImg = candidate.avatarId.startsWith('data:image');

          return (
            <button
              key={candidate.userId}
              onClick={() => handleVoteClick(candidate.userId)}
              disabled={!!selectedVoteId && !isOwner}
              className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 scale-[1.02] shadow-lg shadow-emerald-500/10'
                  : selectedVoteId
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/60 hover:border-emerald-500/40 transform hover:scale-[1.02] active:scale-95'
              }`}
            >
              {/* Awatar kandydata */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border border-white/10"
                style={{ backgroundColor: candidate.avatarBg }}
              >
                {isCustomImg ? (
                  <img
                    src={candidate.avatarId}
                    alt={candidate.displayName}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <span>{preset?.icon || '♟️'}</span>
                )}
              </div>

              {/* Nazwa */}
              <span className="text-xs font-bold text-white truncate max-w-full">
                {candidate.displayName}
              </span>

              {/* Znacznik zaznaczenia */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 p-0.5 rounded-full shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Komunikat o zablokowanym głosie */}
      {selectedVoteId && (
        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Głos oddany! Czekamy na pozostałych graczy...</span>
        </div>
      )}
    </div>
  );
};
