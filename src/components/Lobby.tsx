import React, { useState } from 'react';
import { Player, UserProfile } from '../types';
import { AvatarPicker, AVATAR_PRESETS } from './AvatarPicker';
import { Check, Users, Clock, LogOut, Sparkles } from 'lucide-react';

interface LobbyProps {
  roomId: string;
  players: Player[];
  myUserId: string;
  countdownSeconds: number;
  isStarting: boolean;
  onToggleReady: () => void;
  onUpdateProfile: (updates: { displayName?: string; avatarId?: string; avatarBg?: string }) => void;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomId,
  players,
  myUserId,
  countdownSeconds,
  isStarting,
  onToggleReady,
  onUpdateProfile,
  onLeave,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const me = players.find((p) => p.userId === myUserId);
  const myReady = me?.isReady || false;
  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 md:p-8 text-slate-100 max-w-4xl mx-auto">
      {/* Pasek górny */}
      <header className="w-full flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
            ♟️
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Poczekalnia</h2>
            <p className="text-xs text-slate-400">
              Pokój: <span className="font-mono text-emerald-400">{roomId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Opuść pokój</span>
        </button>
      </header>

      {/* Środek: Lista Graczy & Status */}
      <main className="w-full flex-1 flex flex-col justify-center items-center my-6 max-w-2xl space-y-6">
        {/* Baner Statusu Odliczania */}
        {isStarting ? (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-center gap-3 animate-pulse">
            <Clock className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-lg font-black text-emerald-400">
              Start gry za {countdownSeconds} sekundy!
            </span>
          </div>
        ) : (
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">
                Gracze w pokoju: <strong className="text-white">{players.length}/4</strong>
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {players.length < 3
                ? 'Oczekiwanie na graczy (min. 3)...'
                : players.length === 3
                ? `Gotowi: ${readyCount}/3 (wymagana zgoda wszystkich)`
                : 'Pokój pełny! Start za chwilę...'}
            </span>
          </div>
        )}

        {/* Siatka 4 miejsc */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((slotIndex) => {
            const player = players[slotIndex];
            const isMe = player?.userId === myUserId;
            const preset = player ? AVATAR_PRESETS.find((p) => p.id === player.avatarId) : null;
            const isCustomImg = player?.avatarId.startsWith('data:image');

            if (!player) {
              return (
                <div
                  key={slotIndex}
                  className="h-32 rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center text-slate-600 gap-1"
                >
                  <Users className="w-6 h-6 stroke-1 opacity-50" />
                  <span className="text-xs font-medium">Wolne miejsce...</span>
                </div>
              );
            }

            return (
              <div
                key={player.userId}
                className={`relative rounded-2xl p-4 transition-all border flex items-center gap-4 ${
                  player.isReady
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {/* Awatar */}
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-md border border-white/20"
                    style={{ backgroundColor: player.avatarBg }}
                  >
                    {isCustomImg ? (
                      <img
                        src={player.avatarId}
                        alt="Awatar"
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <span>{preset?.icon || '♟️'}</span>
                    )}
                  </div>
                  {isMe && (
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 hover:text-white transition-colors"
                      title="Zmień awatar"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Info o graczu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">{player.displayName}</span>
                    {isMe && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.2 rounded">
                        TY
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate">@{player.tiktokUsername}</div>

                  <div className="mt-2 flex items-center gap-1">
                    {player.isReady ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3 stroke-[3]" /> GOTOWY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full">
                        Oczekuje
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dolny pasek akcji: Przycisk GOTOWY */}
        <div className="w-full pt-4 flex flex-col items-center gap-3">
          <button
            onClick={onToggleReady}
            disabled={isStarting}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${
              myReady
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 transform hover:scale-[1.01]'
            }`}
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>{myReady ? 'ANULUJ GOTOWOŚĆ' : 'GOTOWY'}</span>
          </button>

          <p className="text-xs text-slate-400 text-center">
            {players.length >= 3
              ? 'Wszyscy gracze muszą kliknąć GOTOWY, aby rozpocząć grę.'
              : 'Gra rozpocznie się, gdy do pokoju dołączy co najmniej 3 graczy.'}
          </p>
        </div>
      </main>

      {/* Stopka */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium">
        Pionkiii ♟️ • Poczekalnia gry wieloosobowej
      </footer>

      {/* Modal Awatara bezpośrednio w lobby */}
      {showAvatarPicker && me && (
        <AvatarPicker
          currentAvatarId={me.avatarId}
          currentBgColor={me.avatarBg}
          onSave={(avatarId, avatarBg) => {
            onUpdateProfile({ avatarId, avatarBg });
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
};
