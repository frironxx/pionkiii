import React, { useState } from 'react';
import { isCustomAvatar } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check } from 'lucide-react';

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

  const voteableCandidates = candidates.filter((c) => c.userId !== myUserId);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftSeconds / totalDurationSeconds) * 100));

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-1.5 px-1 flex-shrink-0">
      {/* Pasek postępu czasu */}
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
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
          className={`text-xs font-black min-w-[24px] text-right ${
            timeLeftSeconds <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
          }`}
        >
          {timeLeftSeconds}s
        </span>
      </div>

      {/* Dyskretna informacja dla właściciela (Poker Face) */}
      {isOwner && (
        <div className="w-full py-1 px-2.5 rounded-xl bg-violet-950/80 border border-violet-500/50 flex items-center justify-between text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🤫</span>
            <span className="text-[11px] font-black text-violet-300 uppercase">
              To Twój film! Poker face
            </span>
          </div>
          <span className="text-[9px] text-violet-400 font-bold">
            (Klikaj dla zmyłki)
          </span>
        </div>
      )}

      {/* Przyciski graczy do głosowania - układ kafelkowy na dole */}
      <div
        className={`w-full grid gap-1.5 ${
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
          const isCustom = isCustomAvatar(candidate.avatarId);

          return (
            <button
              key={candidate.userId}
              onClick={() => handleVoteClick(candidate.userId)}
              disabled={!!selectedVoteId && !isOwner}
              className={`relative h-12 rounded-xl border transition-all flex items-center gap-2 px-2 select-none overflow-hidden ${
                isSelected
                  ? 'bg-emerald-500/30 border-emerald-400 scale-[1.02] shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                  : selectedVoteId
                  ? 'bg-slate-900/50 border-slate-800 opacity-50'
                  : 'bg-slate-900/90 hover:bg-slate-850 active:scale-95 border-slate-700/80 shadow-md'
              }`}
            >
              {/* Awatar / Zdjęcie */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow border border-white/20 overflow-hidden flex-shrink-0"
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

              {/* Nick gracza */}
              <span className="text-xs font-black text-white truncate flex-1 text-left">
                {candidate.displayName}
              </span>

              {/* Znacznik zaznaczenia */}
              {isSelected && (
                <div className="bg-emerald-500 text-slate-950 p-0.5 rounded-full shadow flex-shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
