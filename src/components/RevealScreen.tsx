import React from 'react';
import { RoundResult, Player, isCustomAvatar } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check, X, ShieldAlert, Flame, Sparkles, Crown } from 'lucide-react';

interface RevealScreenProps {
  phase: 'ROUND_REVEAL_VOTES' | 'ROUND_REVEAL_OWNER';
  result: RoundResult | null;
  players: Player[];
  myUserId: string;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  phase,
  result,
  players,
  myUserId,
}) => {
  if (!result && phase === 'ROUND_REVEAL_OWNER') return null;

  const getPlayer = (userId: string) => players.find((p) => p.userId === userId);

  const owner = result ? getPlayer(result.actualOwnerUserId) : null;
  const ownerPreset = owner ? AVATAR_PRESETS.find((p) => p.id === owner.avatarId) : null;
  const isOwnerCustom = isCustomAvatar(owner?.avatarId);

  const myPoints = result?.pointsGained[myUserId] || 0;
  const isMeOwner = result?.actualOwnerUserId === myUserId;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2 animate-fade-in px-1 flex-shrink-0">
      {phase === 'ROUND_REVEAL_VOTES' ? (
        /* Faza 1: Pokazanie głosów */
        <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 text-center space-y-2 shadow-2xl backdrop-blur-md">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kto jak wytypował?</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {players.map((p) => {
              const votedForId = result?.votes[p.userId];
              const votedTarget = votedForId ? getPlayer(votedForId) : null;

              return (
                <div
                  key={p.userId}
                  className="bg-slate-950/80 rounded-xl p-1.5 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-300 truncate max-w-[45%]">
                    {p.displayName}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-black text-emerald-400 truncate">
                    <span>👉</span>
                    <span className="truncate">{votedTarget ? votedTarget.displayName : 'Brak'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Faza 2: Efektowne odsłonięcie prawdziwego właściciela */
        <div className="w-full bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-slate-950/95 border-2 border-emerald-400/70 rounded-2xl p-3 text-center space-y-2 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Etykieta nagłówka */}
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>TEN FILM POLUBIŁ(A):</span>
          </div>

          {/* Karta właściciela z awatarem i nickiem */}
          <div className="flex items-center justify-center gap-3 bg-slate-950/70 py-2 px-3 rounded-xl border border-slate-800">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xl border-2 border-emerald-400 overflow-hidden flex-shrink-0"
              style={{ backgroundColor: owner?.avatarBg || '#10b981' }}
            >
              {isOwnerCustom ? (
                <img
                  src={owner?.avatarId}
                  alt={owner?.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{ownerPreset?.icon || '♟️'}</span>
              )}
            </div>

            <div className="text-left min-w-0">
              <h3 className="text-base font-black text-white leading-tight truncate">
                {owner?.displayName}
              </h3>
              <div className="text-[11px] font-bold text-emerald-400 truncate">
                @{owner?.tiktokUsername}
              </div>
            </div>
          </div>

          {/* Podsumowanie punktowe */}
          <div className="flex items-center justify-center">
            {myPoints > 0 ? (
              <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 shadow">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trafione! +{myPoints} pkt</span>
              </div>
            ) : isMeOwner ? (
              <div className="w-full py-1.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                To Twój film!
              </div>
            ) : (
              <div className="w-full py-1.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                <span>Pudło! To nie ten gracz.</span>
              </div>
            )}
          </div>

          {/* Alert Bonusu Niewidzialności */}
          {result?.stealthAwarded && (
            <div className="py-1 px-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[11px] font-black flex items-center justify-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
              <span>🤫 BONUS NIEWIDZIALNOŚCI! Nikt nie zgadł {owner?.displayName}!</span>
            </div>
          )}

          {/* Rundy finałowe x2 */}
          {result?.isClutch && (
            <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>Rundy Finałowe: Punkty x2!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
