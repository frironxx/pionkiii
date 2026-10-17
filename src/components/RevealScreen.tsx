import React from 'react';
import { RoundResult, Player } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check, X, ShieldAlert, Flame, Sparkles, Award } from 'lucide-react';

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
  const isOwnerCustom = owner?.avatarId.startsWith('data:image');

  const myPoints = result?.pointsGained[myUserId] || 0;
  const isMeOwner = result?.actualOwnerUserId === myUserId;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-3 animate-fade-in px-1">
      {phase === 'ROUND_REVEAL_VOTES' ? (
        /* Faza 1: Pokazanie głosów */
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-center space-y-2.5 shadow-2xl backdrop-blur-md">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kto jak wytypował?</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {players.map((p) => {
              const votedForId = result?.votes[p.userId];
              const votedTarget = votedForId ? getPlayer(votedForId) : null;

              return (
                <div
                  key={p.userId}
                  className="bg-slate-950/70 rounded-xl p-2 border border-slate-800 flex items-center justify-between text-xs"
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
        <div className="w-full bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-emerald-500/50 rounded-3xl p-4 text-center space-y-3 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Etykieta nagłówka */}
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>TO POLUBIENIE NALEŻY DO:</span>
          </div>

          {/* Awatar i nick właściciela */}
          <div className="flex items-center justify-center gap-4 bg-slate-950/60 py-3 px-4 rounded-2xl border border-slate-800/80">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 border-emerald-400/80 overflow-hidden transform animate-bounce-short"
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

            <div className="text-left">
              <h3 className="text-xl font-black text-white leading-tight">{owner?.displayName}</h3>
              <div className="text-xs font-bold text-emerald-400">@{owner?.tiktokUsername}</div>
            </div>
          </div>

          {/* Wynik punktowy gracza */}
          <div className="flex items-center justify-center">
            {myPoints > 0 ? (
              <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm flex items-center justify-center gap-1.5 shadow">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Brawo! Zdobywasz +{myPoints} pkt!</span>
              </div>
            ) : isMeOwner ? (
              <div className="w-full py-2 px-3 rounded-xl bg-slate-800/80 text-slate-300 font-bold text-xs">
                To Twój film – ktoś Cię rozszyfrował!
              </div>
            ) : (
              <div className="w-full py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5">
                <X className="w-4 h-4" />
                <span>Pudło! To nie ten gracz.</span>
              </div>
            )}
          </div>

          {/* Bonus Niewidzialności */}
          {result?.stealthAwarded && (
            <div className="py-1.5 px-3 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-black flex items-center justify-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-violet-400" />
              <span>🤫 BONUS NIEWIDZIALNOŚCI! Nikt nie zgadł {owner?.displayName}!</span>
            </div>
          )}

          {/* Informacja o rundzie x2 */}
          {result?.isClutch && (
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>Rundy Finałowe: Podwójne punkty (x2)!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
