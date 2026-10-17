import React, { useState } from 'react';
import { Player, isCustomAvatar } from '../types';
import { AvatarPicker, AVATAR_PRESETS } from './AvatarPicker';
import { Check, Users, Clock, LogOut, Camera } from 'lucide-react';

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
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col justify-between p-3 sm:p-6 text-slate-100 max-w-lg mx-auto overflow-hidden select-none">
      {/* Pasek górny */}
      <header className="w-full flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg">
            ♟️
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Poczekalnia</h2>
            <p className="text-[10px] text-slate-400">
              Pokój: <span className="font-mono text-emerald-400">{roomId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Wyjdź</span>
        </button>
      </header>

      {/* Środek: Siatka graczy i status */}
      <main className="w-full flex-1 flex flex-col justify-center gap-3 my-2 overflow-hidden">
        {/* Baner Statusu Odliczania */}
        {isStarting ? (
          <div className="w-full bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-center gap-2 animate-pulse">
            <Clock className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-sm font-black text-emerald-400">
              Start gry za {countdownSeconds}s!
            </span>
          </div>
        ) : (
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-2 px-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-300">
                Gracze: <strong className="text-white">{players.length}/4</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">
              {players.length < 3
                ? 'Czekamy na min. 3 graczy...'
                : `Gotowi: ${readyCount}/${players.length}`}
            </span>
          </div>
        )}

        {/* Siatka 4 miejsc */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((slotIndex) => {
            const player = players[slotIndex];
            const isMe = player?.userId === myUserId;
            const preset = player ? AVATAR_PRESETS.find((p) => p.id === player.avatarId) : null;
            const isCustom = isCustomAvatar(player?.avatarId);

            if (!player) {
              return (
                <div
                  key={slotIndex}
                  className="h-24 rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center text-slate-600 gap-1"
                >
                  <Users className="w-5 h-5 stroke-1 opacity-40" />
                  <span className="text-[10px] font-bold">Wolne miejsce...</span>
                </div>
              );
            }

            return (
              <div
                key={player.userId}
                className={`relative rounded-2xl p-2.5 transition-all border flex items-center gap-2.5 ${
                  player.isReady
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {/* Awatar / Zdjęcie */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow border border-white/20 overflow-hidden"
                    style={{ backgroundColor: player.avatarBg }}
                  >
                    {isCustom ? (
                      <img
                        src={player.avatarId}
                        alt="Awatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{preset?.icon || '♟️'}</span>
                    )}
                  </div>
                  {isMe && (
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 hover:text-white"
                      title="Zmień zdjęcie"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Info o graczu */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-white truncate">{player.displayName}</span>
                    {isMe && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-1 rounded">
                        TY
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">@{player.tiktokUsername}</div>
                  {player.hasPublicLikes === false && (
                    <div className="text-[8px] font-bold text-amber-400/90 flex items-center gap-0.5 truncate" title="Prywatne polubienia na TikToku">
                      <span>⚠️</span>
                      <span className="truncate">Ukryte polubienia</span>
                    </div>
                  )}

                  <div className="mt-1">
                    {player.isReady ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> GOTOWY
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded-full">
                        Czeka
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wskazówka jeśli gracz ma ukryte polubienia na TikToku */}
        {me && me.hasPublicLikes === false && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-left flex-shrink-0">
            <span className="text-sm flex-shrink-0">⚠️</span>
            <div className="text-[10px] text-amber-300 leading-tight">
              <strong className="text-amber-200">Twoje polubienia na TT są ukryte!</strong> Aby Twoje filmy były w grze: TikTok &rarr; Profil &rarr; Ustawienia &rarr; Prywatność &rarr; Polubione filmy &rarr; <strong>Wszyscy</strong>.
            </div>
          </div>
        )}
      </main>

      {/* Dolny pasek akcji */}
      <footer className="w-full pt-1 flex flex-col items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleReady}
          disabled={isStarting}
          className={`w-full py-3.5 rounded-2xl font-black text-base tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 ${
            myReady
              ? 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/40'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{myReady ? 'ANULUJ GOTOWOŚĆ' : 'GOTOWY'}</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          {players.length >= 3
            ? 'Wszyscy gracze muszą kliknąć GOTOWY, aby zacząć mecz!'
            : 'Mecz rozpocznie się, gdy w pokoju będą co najmniej 3 osoby.'}
        </p>
      </footer>

      {/* Modal Awatara */}
      {showAvatarPicker && me && (
        <AvatarPicker
          userId={me.userId}
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
