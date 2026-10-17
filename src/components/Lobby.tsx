import React, { useState } from 'react';
import { Player, isCustomAvatar } from '../types';
import { AvatarPicker, AVATAR_PRESETS } from './AvatarPicker';
import { Check, Users, Clock, LogOut, Camera, RefreshCw, Edit2 } from 'lucide-react';

interface LobbyProps {
  roomId: string;
  players: Player[];
  myUserId: string;
  countdownSeconds: number;
  isStarting: boolean;
  onToggleReady: () => void;
  onUpdateProfile: (updates: { displayName?: string; avatarId?: string; avatarBg?: string; tiktokUsername?: string }) => void;
  onRefreshTikTok: () => void;
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
  onRefreshTikTok,
  onLeave,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditingTikTok, setIsEditingTikTok] = useState(false);
  const [newTikTokInput, setNewTikTokInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const me = players.find((p) => p.userId === myUserId);
  const myReady = me?.isReady || false;
  const readyCount = players.filter((p) => p.isReady).length;

  const handleSaveTikTok = () => {
    const clean = newTikTokInput.trim().toLowerCase().replace(/^@/, '');
    if (clean) {
      onUpdateProfile({ tiktokUsername: clean });
    }
    setIsEditingTikTok(false);
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefreshTikTok();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Czy którykolwiek gracz ma 0 filmów?
  const anyPlayerHasZero = players.some((p) => (p.videoCount ?? 0) === 0);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col justify-between p-3 sm:p-5 text-slate-100 max-w-lg mx-auto overflow-hidden select-none">
      {/* Pasek górny */}
      <header className="w-full flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg">
            ♟️
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Poczekalnia</h2>
            <p className="text-[10px] text-slate-400">
              Pokój: <span className="font-mono text-emerald-400 font-bold">{roomId}</span>
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

      {/* Środek: Gracze, status filmów i odliczanie */}
      <main className="w-full flex-1 flex flex-col justify-center gap-2.5 my-1.5 overflow-hidden">
        {/* Baner Statusu Odliczania LUB Graczy */}
        {isStarting ? (
          <div className="w-full bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-center gap-2 animate-pulse flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-sm font-black text-emerald-400">
              Start gry za {countdownSeconds}s!
            </span>
          </div>
        ) : (
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-1.5 px-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-300">
                Gracze: <strong className="text-white">{players.length}/4</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">
              {players.length < 2
                ? 'Czekamy na drugiego gracza...'
                : `Gotowi: ${readyCount}/${players.length}`}
            </span>
          </div>
        )}

        {/* Siatka miejsc dla graczy */}
        <div className="w-full grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((slotIndex) => {
            const player = players[slotIndex];
            const isMe = player?.userId === myUserId;
            const preset = player ? AVATAR_PRESETS.find((p) => p.id === player.avatarId) : null;
            const isCustom = isCustomAvatar(player?.avatarId);
            const vCount = player?.videoCount ?? 0;
            const hasVids = vCount > 0;

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
                className={`relative rounded-2xl p-2 transition-all border flex flex-col justify-between ${
                  player.isReady
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Awatar / Zdjęcie */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow border border-white/20 overflow-hidden"
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
                        className="absolute -bottom-1 -right-1 p-0.5 bg-slate-950 border border-slate-700 rounded-md text-emerald-400 hover:text-white"
                        title="Zmień zdjęcie"
                      >
                        <Camera className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Nick i @tiktok */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white truncate">{player.displayName}</span>
                      {isMe && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-1 rounded">
                          TY
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <span>@{player.tiktokUsername}</span>
                      {isMe && !isEditingTikTok && (
                        <button
                          onClick={() => {
                            setNewTikTokInput(player.tiktokUsername);
                            setIsEditingTikTok(true);
                          }}
                          className="text-slate-500 hover:text-emerald-400"
                          title="Zmień konto TikTok"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status filmów z TikToka */}
                <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                  {hasVids ? (
                    <span className="font-bold text-emerald-400 truncate">
                      🎥 {vCount} filmów ✅
                    </span>
                  ) : (
                    <span className="font-bold text-amber-400 truncate" title="Konto prywatne na TikToku">
                      ⚠️ 0 filmów (Prywatne)
                    </span>
                  )}

                  {player.isReady ? (
                    <span className="inline-flex items-center gap-0.5 font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> GOTOWY
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-800/40 px-1 rounded">
                      Czeka
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal edycji @TikTok bezpośrednio w Lobby */}
        {isEditingTikTok && (
          <div className="w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-2.5 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">@</span>
            <input
              type="text"
              value={newTikTokInput}
              onChange={(e) => setNewTikTokInput(e.target.value)}
              placeholder="nowy_tiktok"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              onClick={handleSaveTikTok}
              className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black"
            >
              Zapisz
            </button>
            <button
              onClick={() => setIsEditingTikTok(false)}
              className="px-2 py-1 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
            >
              Anuluj
            </button>
          </div>
        )}

        {/* Instrukcja jeśli ktoś ma 0 filmów z TikToka */}
        {anyPlayerHasZero && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2 text-left flex-shrink-0 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
                <span>⚠️</span>
                <span>Jak odblokować filmy kolegi z TikToka:</span>
              </div>
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Odśwież</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-300/80 leading-tight">
              W TikToku: <strong>Profil</strong> ➔ <strong>Menu</strong> ➔ <strong>Ustawienia i prywatność</strong> ➔ <strong>Prywatność</strong>:
              wyłącz <em>"Konto prywatne"</em> oraz zmień <em>"Polubione filmy"</em> na <strong>"Wszyscy"</strong>.
            </p>
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
          {isStarting ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5 stroke-[3]" />
          )}
          <span>{myReady ? 'JESTEŚ GOTOWY' : 'GOTOWY DO GRY'}</span>
        </button>
      </footer>

      {/* Modal wyboru zdjęcia / awatara */}
      {showAvatarPicker && (
        <AvatarPicker
          selectedAvatarId={me?.avatarId || 'pawn_emerald'}
          selectedBg={me?.avatarBg || '#10b981'}
          onSelectAvatar={(avatarId, bg) => {
            onUpdateProfile({ avatarId, avatarBg: bg });
            setShowAvatarPicker(false);
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
};
