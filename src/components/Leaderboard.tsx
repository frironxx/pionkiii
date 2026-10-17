import React from 'react';
import { LeaderboardEntry } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Trophy, Flame, ShieldAlert, Sparkles, Clock } from 'lucide-react';

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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-5 animate-fade-in">
      {/* Karta Wyników */}
      <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
        {/* Nagłówek */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
              Tabela Wyników • Runda {roundNumber}/{totalRounds}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Kolejna za {nextRoundInSeconds}s</span>
          </div>
        </div>

        {/* Lista Graczy */}
        <div className="space-y-2.5">
          {standings.map((player, index) => {
            const isMe = player.userId === myUserId;
            const preset = AVATAR_PRESETS.find((p) => p.id === player.avatarId);
            const isCustom = player.avatarId.startsWith('data:image');

            return (
              <div
                key={player.userId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Pozycja + Awatar + Nick */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-sm font-black ${
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow border border-white/10"
                    style={{ backgroundColor: player.avatarBg }}
                  >
                    {isCustom ? (
                      <img
                        src={player.avatarId}
                        alt={player.displayName}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <span>{preset?.icon || '♟️'}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{player.displayName}</span>
                      {isMe && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.2 rounded">
                          TY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Seria trafień */}
                      {player.streak >= 2 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          Seria x{player.streak >= 5 ? '3' : player.streak >= 3 ? '1.5' : '1.2'}
                        </span>
                      )}

                      {/* Odgadnięte */}
                      <span className="text-[10px] text-slate-400">
                        Trafień: {player.correctGuesses}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Punkty */}
                <div className="text-right">
                  <div className="text-base font-black text-emerald-400">
                    {player.score.toLocaleString('pl-PL')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">PUNKTY</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
