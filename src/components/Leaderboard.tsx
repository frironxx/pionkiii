import React from 'react';
import { LeaderboardEntry, isCustomAvatar } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Trophy, Flame, Clock } from 'lucide-react';

interface LeaderboardProps {
  roundNumber: number;
  totalRounds: number;
  standings: LeaderboardEntry[];
  myUserId: string;
  nextRoundInSeconds: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  roundNumber,
  totalRounds,
  standings,
  myUserId,
  nextRoundInSeconds,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center gap-3 animate-fade-in p-1">
      {/* Karta Wyników */}
      <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3">
        {/* Pasek górny */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Wyniki • Runda {roundNumber}/{totalRounds}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-black">
            <Clock className="w-3.5 h-3.5" />
            <span>Start za {nextRoundInSeconds}s</span>
          </div>
        </div>

        {/* Lista Graczy */}
        <div className="space-y-2">
          {standings.map((player, index) => {
            const isMe = player.userId === myUserId;
            const preset = AVATAR_PRESETS.find((p) => p.id === player.avatarId);
            const isCustom = isCustomAvatar(player.avatarId);

            return (
              <div
                key={player.userId}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {/* Pozycja + Awatar + Nick */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 text-center text-xs font-black ${
                      index === 0
                        ? 'text-amber-400'
                        : index === 1
                        ? 'text-slate-300'
                        : index === 2
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow border border-white/10 overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: player.avatarBg }}
                  >
                    {isCustom ? (
                      <img
                        src={player.avatarId}
                        alt={player.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{preset?.icon || '♟️'}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white truncate">
                        {player.displayName}
                      </span>
                      {isMe && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-1 py-0.2 rounded">
                          TY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {player.streak >= 2 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-400 bg-amber-400/10 px-1 rounded-full border border-amber-400/20">
                          <Flame className="w-2.5 h-2.5 fill-amber-400" />
                          x{player.streak >= 5 ? '3' : player.streak >= 3 ? '1.5' : '1.2'}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400">
                        Trafień: {player.correctGuesses}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Punkty */}
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-black text-emerald-400">
                    {player.score.toLocaleString('pl-PL')}
                  </div>
                  <div className="text-[8px] text-slate-500 font-black uppercase">PUNKTY</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
