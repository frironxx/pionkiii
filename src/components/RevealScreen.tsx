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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-5 animate-fade-in">
      {phase === 'ROUND_REVEAL_VOTES' ? (
        /* Faza 1: Pokazanie głosów */
        <div className="w-full glass-panel rounded-3xl p-6 text-center space-y-4 border border-slate-800 shadow-2xl">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Kto jak zagłosował?</span>
          </div>

          <div className="text-xl font-black text-white">Rozszyfrowywanie wyborów...</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {players.map((p) => {
              const votedForId = result?.votes[p.userId];
              const votedTarget = votedForId ? getPlayer(votedForId) : null;

              return (
                <div
                  key={p.userId}
                  className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-300 truncate">{p.displayName}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">→</span>
                    <span className="font-bold text-emerald-400">
                      {votedTarget ? votedTarget.displayName : 'Brak głosu'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Faza 2: Odsłonięcie Prawdziwego Właściciela */
        <div className="w-full glass-panel-accent rounded-3xl p-6 text-center space-y-5 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          {/* Tytuł nagłówka */}
          <div className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>PRAWDZIWY WŁAŚCICIEL POLUBIENIA</span>
          </div>

          {/* Awatar i nick właściciela */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border-4 border-emerald-400/80 transform animate-bounce-short"
              style={{ backgroundColor: owner?.avatarBg || '#10b981' }}
            >
              {isOwnerCustom ? (
                <img
                  src={owner?.avatarId}
                  alt={owner?.displayName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span>{ownerPreset?.icon || '♟️'}</span>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">{owner?.displayName}</h3>
              <div className="text-xs font-semibold text-emerald-400">@{owner?.tiktokUsername}</div>
            </div>
          </div>

          {/* Dedykowany baner z punktami gracza */}
          {myPoints > 0 ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-extrabold text-emerald-300">
                Zdobywasz +{myPoints} pkt!
              </span>
            </div>
          ) : isMeOwner ? (
            <div className="bg-slate-900/60 rounded-2xl p-3 text-xs text-slate-400">
              Ktoś odgadł Twój film – brak punktów niewidzialności w tej rundzie.
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-2xl p-3 text-xs text-rose-400 font-semibold flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" />
              Niestety, to nie ten gracz!
            </div>
          )}

          {/* Bonus Niewidzialności (Stealth Bonus) */}
          {result?.stealthAwarded && (
            <div className="bg-violet-500/20 border border-violet-500/40 rounded-2xl p-3 flex items-center justify-center gap-2 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-violet-400" />
              <span className="text-xs sm:text-sm font-black text-violet-300">
                🤫 BONUS NIEWIDZIALNOŚCI! Nikt nie odgadł filmu {owner?.displayName}!
              </span>
            </div>
          )}

          {/* Rundy Finałowe x2 */}
          {result?.isClutch && (
            <div className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Rundy Finałowe: Podwójne punkty aktywne (x2)!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
