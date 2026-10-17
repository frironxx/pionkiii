import React from 'react';
import { RoundResult, Player, isCustomAvatar } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Check, X, ShieldAlert, Sparkles, Crown, Flame } from 'lucide-react';

interface RevealScreenProps {
  phase?: string;
  result: RoundResult | null;
  players: Player[];
  myUserId: string;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  result,
  players,
  myUserId,
}) => {
  if (!result) return null;

  const getPlayer = (userId: string) => players.find((p) => p.userId === userId);

  const owner = getPlayer(result.actualOwnerUserId);
  const ownerPreset = owner ? AVATAR_PRESETS.find((p) => p.id === owner.avatarId) : null;
  const isOwnerCustom = isCustomAvatar(owner?.avatarId);

  const myPoints = result.pointsGained[myUserId] || 0;
  const isMeOwner = result.actualOwnerUserId === myUserId;
  const voters = players.filter((p) => p.userId !== result.actualOwnerUserId);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-1.5 animate-fade-in px-1 flex-shrink-0 select-none">
      {/* Główna Karta Odsłonięcia Prawdziwego Właściciela */}
      <div className="w-full bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-slate-950/95 border-2 border-emerald-400/80 rounded-2xl p-2.5 text-center space-y-2 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Nagłówek: Prawdziwy Właściciel */}
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>TEN FILM POLUBIŁ(A):</span>
        </div>

        {/* Profil Prawdziwego Właściciela */}
        <div className="flex items-center justify-center gap-3 bg-slate-950/80 py-1.5 px-3 rounded-xl border border-emerald-500/30">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg border-2 border-emerald-400 overflow-hidden flex-shrink-0"
            style={{ backgroundColor: owner?.avatarBg || '#10b981' }}
          >
            {isOwnerCustom ? (
              <img
                src={owner?.avatarId}
                alt={result.actualOwnerDisplayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{ownerPreset?.icon || '♟️'}</span>
            )}
          </div>

          <div className="text-left min-w-0">
            <h3 className="text-sm font-black text-white leading-tight truncate">
              {result.actualOwnerDisplayName}
            </h3>
            <div className="text-[11px] font-bold text-emerald-400 truncate">
              @{result.actualOwnerUsername || owner?.tiktokUsername}
            </div>
          </div>
        </div>

        {/* Informacja o Kamuflażu Właściciela */}
        {result.stealthAwarded ? (
          <div className="py-1 px-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[11px] font-black flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>🤫 KAMUFLAŻ UDANY! Nikt nie zgadł (+300 pkt)</span>
          </div>
        ) : (
          <div className="py-0.5 px-2 rounded-lg bg-slate-800/80 text-slate-400 text-[10px] font-bold">
            Właściciel został odgadnięty (0 pkt za kamuflaż)
          </div>
        )}

        {/* Kto jak głosował */}
        <div className="w-full pt-1 border-t border-slate-800/80">
          <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
            Głosy graczy:
          </div>
          <div className="grid grid-cols-2 gap-1">
            {voters.map((p) => {
              const votedForId = result.votes[p.userId];
              const votedTarget = votedForId ? getPlayer(votedForId) : null;
              const isCorrect = votedForId === result.actualOwnerUserId;
              const pts = result.pointsGained[p.userId] || 0;

              return (
                <div
                  key={p.userId}
                  className={`rounded-lg py-1 px-1.5 border flex items-center justify-between text-[11px] font-bold ${
                    isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="truncate max-w-[45%] text-slate-200">
                    {p.displayName}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="truncate max-w-[50px]">{votedTarget?.displayName || 'Brak'}</span>
                    {isCorrect ? (
                      <span className="text-emerald-400 font-black">+{pts}</span>
                    ) : (
                      <X className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Osobisty komunikat dla gracza */}
        <div className="pt-0.5">
          {isMeOwner ? (
            <div className={`py-1 px-2 rounded-xl text-xs font-black ${
              result.stealthAwarded ? 'bg-violet-500/25 text-violet-300' : 'bg-slate-800 text-slate-300'
            }`}>
              {result.stealthAwarded ? '🎉 Zgarniasz +300 pkt za kamuflaż!' : 'To Twój film — zostałeś odkryty!'}
            </div>
          ) : myPoints > 0 ? (
            <div className="py-1 px-2 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-black text-xs flex items-center justify-center gap-1 shadow">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Trafiłeś bezbłędnie! +{myPoints} pkt</span>
            </div>
          ) : (
            <div className="py-1 px-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1">
              <X className="w-3 h-3 text-rose-400" />
              <span>Pudło! To nie ten gracz.</span>
            </div>
          )}
        </div>

        {/* Finały x2 */}
        {result.isClutch && (
          <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 fill-amber-400" />
            <span>Rundy Finałowe: Punkty x2!</span>
          </div>
        )}
      </div>
    </div>
  );
};
