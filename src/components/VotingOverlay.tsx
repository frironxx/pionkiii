import React, { useState } from 'react';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check, Sparkles } from 'lucide-react';

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
    if (selectedVoteId) return;
    setSelectedVoteId(candidateId);
    onCastVote(candidateId);
  };

  // Kandydaci (inni gracze)
  const voteableCandidates = candidates.filter((c) => c.userId !== myUserId);

  const progressPercent = Math.max(0, Math.min(100, (timeLeftSeconds / totalDurationSeconds) * 100));

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-2 px-1">
      {/* Kompaktowy pasek czasu */}
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 whitespace-nowrap">
          KTO TO POLUBIŁ?
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-linear rounded-full ${
              timeLeftSeconds <= 5 ? 'bg-rose-500' : isClutch ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span
          className={`text-[11px] font-black w-6 text-right ${
            timeLeftSeconds <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
          }`}
        >
          {timeLeftSeconds}s
        </span>
      </div>

      {/* Dyskretna informacja dla właściciela filmu (Poker Face) */}
      {isOwner && (
        <div className="w-full py-1.5 px-3 rounded-xl bg-violet-950/60 border border-violet-500/40 flex items-center justify-between text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🤫</span>
            <span className="text-[11px] font-black text-violet-300 uppercase">
              To Twój film! Poker face
            </span>
          </div>
          <span className="text-[9px] text-violet-400 font-semibold">
            (Klikaj dla zmyłki)
          </span>
        </div>
      )}

      {/* Przyciski graczy do wyboru - dopasowane do 1 ekranu */}
      <div
        className={`w-full grid gap-2 ${
          voteableCandidates.length <= 2
            ? 'grid-cols-2'
            : voteableCandidates.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-3 sm:grid-cols-4'
        }`}
      >
        {voteableCandidates.map((candidate) => {
          const isSelected = selectedVoteId === candidate.userId;
          const preset = AVATAR_PRESETS.find((p) => p.id === candidate.avatarId);
          const isCustom = candidate.avatarId.startsWith('data:image');

          return (
            <button
              key={candidate.userId}
              onClick={() => handleVoteClick(candidate.userId)}
              disabled={!!selectedVoteId && !isOwner}
              className={`relative py-2 px-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 select-none ${
                isSelected
                  ? 'bg-emerald-500/25 border-emerald-400 scale-[1.03] shadow-lg shadow-emerald-500/20'
                  : selectedVoteId
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  : 'bg-slate-900/80 hover:bg-slate-850 active:scale-95 border-slate-700/70 shadow-md'
              }`}
            >
              {/* Awatar / Zdjęcie */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow border border-white/20 overflow-hidden"
                style={{ backgroundColor: candidate.avatarBg }}
              >
                {isCustom ? (
                  <img
                    src={candidate.avatarId}
                    alt={candidate.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{preset?.icon || '♟️'}</span>
                )}
              </div>

              {/* Nick */}
              <span className="text-[11px] font-black text-white truncate max-w-full">
                {candidate.displayName}
              </span>

              {/* Znacznik wyboru */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Komunikat o oddanym głosie */}
      {selectedVoteId && (
        <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Głos oddany! Czekamy na resztę...</span>
        </div>
      )}
    </div>
  );
};
