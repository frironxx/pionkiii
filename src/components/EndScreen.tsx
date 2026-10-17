import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Trophy, Crown, RotateCcw, Home, Sparkles, ShieldCheck } from 'lucide-react';

interface EndScreenProps {
  standings: LeaderboardEntry[];
  myUserId: string;
  totalRounds: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  standings,
  myUserId,
  totalRounds,
  onPlayAgain,
  onBackToMenu,
}) => {
  const winner = standings[0];

  useEffect(() => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#f59e0b', '#8b5cf6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#f59e0b', '#8b5cf6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const getPreset = (avatarId: string) => AVATAR_PRESETS.find((p) => p.id === avatarId);

  const stealthMaster = [...standings].sort((a, b) => b.stealthBonuses - a.stealthBonuses)[0];
  const bestGuesser = [...standings].sort((a, b) => b.correctGuesses - a.correctGuesses)[0];

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col justify-between p-3 sm:p-6 text-slate-100 max-w-lg mx-auto overflow-hidden select-none">
      {/* Nagłówek */}
      <header className="w-full text-center pb-1 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
          <Trophy className="w-3 h-3" />
          Mecz zakończony (20 Rund)
        </div>
        <h1 className="text-xl font-black text-white mt-1">Koniec Gry!</h1>
      </header>

      {/* Środek: Podium Zwycięzcy & Wyróżnienia */}
      <main className="w-full flex-1 flex flex-col justify-center gap-2.5 my-1 overflow-hidden">
        {/* Karta 1. Miejsca */}
        <div className="w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-3.5 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-2 right-3">
            <Crown className="w-6 h-6 text-amber-400 fill-amber-400 animate-bounce-short" />
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            ZWYCIĘZCA MECZU
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 border-amber-400 overflow-hidden flex-shrink-0"
              style={{ backgroundColor: winner?.avatarBg || '#f59e0b' }}
            >
              {winner?.avatarId.startsWith('data:image') ? (
                <img
                  src={winner?.avatarId}
                  alt={winner?.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getPreset(winner?.avatarId || '')?.icon || '👑'}</span>
              )}
            </div>

            <div className="text-left">
              <h2 className="text-lg font-black text-white leading-tight">{winner?.displayName}</h2>
              <div className="text-base font-black text-emerald-400">
                {winner?.score.toLocaleString('pl-PL')} pkt
              </div>
            </div>
          </div>
        </div>

        {/* Wyróżnienia specjalne */}
        <div className="w-full grid grid-cols-2 gap-2">
          {stealthMaster && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center text-center">
              <ShieldCheck className="w-4 h-4 text-violet-400 mb-0.5" />
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Niewidzialność
              </span>
              <span className="text-xs font-black text-white truncate w-full">
                {stealthMaster.displayName}
              </span>
            </div>
          )}

          {bestGuesser && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center text-center">
              <Sparkles className="w-4 h-4 text-emerald-400 mb-0.5" />
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Trafienia
              </span>
              <span className="text-xs font-black text-white truncate w-full">
                {bestGuesser.displayName} ({bestGuesser.correctGuesses})
              </span>
            </div>
          )}
        </div>

        {/* Pełna lista wyników */}
        <div className="w-full bg-slate-900/50 rounded-2xl p-2.5 border border-slate-800/80 space-y-1">
          {standings.map((p, idx) => (
            <div
              key={p.userId}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-black text-slate-500 text-[11px] w-4">#{idx + 1}</span>
                <span className="font-bold text-white truncate">{p.displayName}</span>
                {p.userId === myUserId && (
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-1 rounded">
                    TY
                  </span>
                )}
              </div>
              <span className="font-mono font-black text-emerald-400 text-xs">
                {p.score.toLocaleString('pl-PL')} pkt
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Dolne przyciski */}
      <footer className="w-full flex gap-2 pt-1 flex-shrink-0">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>Zagraj ponownie</span>
        </button>

        <button
          onClick={onBackToMenu}
          className="py-3 px-4 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm rounded-2xl flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </footer>
    </div>
  );
};
