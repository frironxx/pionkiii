import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry } from '../types';
import { AVATAR_PRESETS } from './AvatarPicker';
import { Trophy, Crown, RotateCcw, Home, Sparkles, ShieldCheck, Flame } from 'lucide-react';

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
  const isMeWinner = winner?.userId === myUserId;

  useEffect(() => {
    // Odpal fajerwerki i confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#f59e0b', '#8b5cf6'],
      });
      confetti({
        particleCount: 4,
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

  // Wyróżnienia meczowe
  const stealthMaster = [...standings].sort((a, b) => b.stealthBonuses - a.stealthBonuses)[0];
  const bestGuesser = [...standings].sort((a, b) => b.correctGuesses - a.correctGuesses)[0];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 md:p-8 text-slate-100 max-w-4xl mx-auto">
      {/* Nagłówek */}
      <header className="w-full text-center py-4 space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          Mecz ukończony (20 Rund)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Koniec Gry!</h1>
      </header>

      {/* Podium Zwycięzcy */}
      <main className="w-full flex-1 flex flex-col items-center justify-center max-w-xl space-y-6 my-4">
        {/* Karta 1. Miejsca */}
        <div className="w-full glass-panel-accent rounded-3xl p-6 text-center space-y-4 border border-amber-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-2 right-4">
            <Crown className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce-short" />
          </div>

          <div className="text-xs font-black uppercase tracking-widest text-amber-400">
            ZWYCIĘZCA MECZU
          </div>

          <div className="flex flex-col items-center justify-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border-4 border-amber-400"
              style={{ backgroundColor: winner?.avatarBg || '#f59e0b' }}
            >
              {winner?.avatarId.startsWith('data:image') ? (
                <img
                  src={winner?.avatarId}
                  alt={winner?.displayName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span>{getPreset(winner?.avatarId || '')?.icon || '👑'}</span>
              )}
            </div>

            <h2 className="text-2xl font-black text-white mt-3">{winner?.displayName}</h2>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {winner?.score.toLocaleString('pl-PL')} pkt
            </div>
          </div>
        </div>

        {/* Wyróżnienia specjalne */}
        <div className="w-full grid grid-cols-2 gap-3">
          {stealthMaster && stealthMaster.stealthBonuses > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 text-violet-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Mistrz Niewidzialności
              </span>
              <span className="text-xs font-bold text-white mt-0.5 truncate w-full">
                {stealthMaster.displayName}
              </span>
              <span className="text-[10px] text-violet-300 font-semibold">
                {stealthMaster.stealthBonuses}x nieodgadniony
              </span>
            </div>
          )}

          {bestGuesser && bestGuesser.correctGuesses > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center">
              <Sparkles className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Najszybszy Detektyw
              </span>
              <span className="text-xs font-bold text-white mt-0.5 truncate w-full">
                {bestGuesser.displayName}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold">
                {bestGuesser.correctGuesses} trafionych filmów
              </span>
            </div>
          )}
        </div>

        {/* Pełna lista wyników */}
        <div className="w-full bg-slate-900/50 rounded-2xl p-4 border border-slate-800 space-y-2">
          {standings.map((p, idx) => (
            <div
              key={p.userId}
              className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                <span className="font-bold text-white">{p.displayName}</span>
                {p.userId === myUserId && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1 rounded">
                    TY
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-emerald-400">
                {p.score.toLocaleString('pl-PL')} pkt
              </span>
            </div>
          ))}
        </div>

        {/* Przyciski Akcji */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.01]"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>ZAGRAJ PONOWNIE</span>
          </button>

          <button
            onClick={onBackToMenu}
            className="py-4 px-6 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Powrót do menu</span>
          </button>
        </div>
      </main>

      {/* Stopka */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium">
        Pionkiii ♟️ • Statystyki meczu zostały zsynchronizowane
      </footer>
    </div>
  );
};
