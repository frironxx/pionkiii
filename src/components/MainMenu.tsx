import React, { useState } from 'react';
import { UserProfile, UserStats } from '../types';
import { AvatarPicker, AVATAR_PRESETS } from './AvatarPicker';
import { Play, Trophy, HelpCircle, User, Flame, Award, Zap, Camera, Upload } from 'lucide-react';

interface MainMenuProps {
  profile: UserProfile;
  stats: UserStats;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onStartMatchmaking: () => void;
  onImportJsonSuccess: (count: number) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  stats,
  onUpdateProfile,
  onStartMatchmaking,
  onImportJsonSuccess,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  const [tiktokInput, setTiktokInput] = useState(profile.tiktokUsername);
  const [displayNameInput, setDisplayNameInput] = useState(profile.displayName);

  const handleBlur = () => {
    let cleanTikTok = tiktokInput.trim().replace(/^@/, '');
    if (!cleanTikTok) cleanTikTok = 'friron411k';
    let cleanNick = displayNameInput.trim();
    if (!cleanNick) cleanNick = cleanTikTok;

    onUpdateProfile({
      ...profile,
      tiktokUsername: cleanTikTok,
      displayName: cleanNick,
    });
  };

  const handleSaveAvatar = (avatarId: string, avatarBg: string) => {
    onUpdateProfile({
      ...profile,
      avatarId,
      avatarBg,
    });
  };

  const handleJsonUpload = async () => {
    if (!jsonText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch('/api/tiktok/import-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.tiktokUsername,
          jsonContent: jsonText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onImportJsonSuccess(data.count);
        setShowImportModal(false);
        setJsonText('');
      } else {
        alert(data.error || 'Nie udało się zaimportować pliku.');
      }
    } catch (e: any) {
      alert('Błąd sieci: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  const activePreset = AVATAR_PRESETS.find((p) => p.id === profile.avatarId);
  const isCustomImg = profile.avatarId.startsWith('data:image');

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col justify-between p-3 sm:p-6 text-slate-100 max-w-lg mx-auto overflow-hidden select-none">
      {/* Pasek górny */}
      <header className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg shadow-inner">
            ♟️
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Pionkiii
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                PL
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Kto polubił ten film?</p>
          </div>
        </div>

        <button
          onClick={() => setShowRulesModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zasady</span>
        </button>
      </header>

      {/* Środek: Karta Profilu, Przycisk GRAJ i Statystyki */}
      <main className="w-full flex-1 flex flex-col justify-center gap-3 my-2 overflow-hidden">
        {/* Karta Profilu */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3.5 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Awatar ze zdjęciem */}
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => setShowAvatarPicker(true)}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/20 overflow-hidden"
                style={{ backgroundColor: profile.avatarBg }}
              >
                {isCustomImg ? (
                  <img
                    src={profile.avatarId}
                    alt="Awatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{activePreset?.icon || '♟️'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 shadow">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Pola danych: TikTok i Nick */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" />
                  TikTok (@username)
                </label>
                <div className="relative mt-0.5">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-black text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={tiktokInput}
                    onChange={(e) => setTiktokInput(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="friron411k"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Twój nick w grze
                </label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Nick"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Przycisk GRAJ */}
        <div className="w-full">
          <button
            onClick={onStartMatchmaking}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xl tracking-wider uppercase shadow-xl shadow-emerald-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>GRAJ</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1 font-medium">
            Jeden klik • Pokoje od 3 do 4 graczy
          </p>
        </div>

        {/* Statystyki Gracza */}
        <div className="w-full bg-slate-900/60 rounded-2xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Twoje Statystyki
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/60">
              <div className="text-[9px] text-slate-400">Gry</div>
              <div className="text-sm font-black text-white mt-0.5">{stats.gamesPlayed}</div>
            </div>

            <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/60">
              <div className="text-[9px] text-slate-400">Wygrane</div>
              <div className="text-sm font-black text-emerald-400 mt-0.5">{stats.gamesWon}</div>
            </div>

            <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/60">
              <div className="text-[9px] text-slate-400">Punkty</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">
                {stats.totalPoints > 9999 ? `${Math.round(stats.totalPoints / 1000)}k` : stats.totalPoints}
              </div>
            </div>

            <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/60">
              <div className="text-[9px] text-slate-400">Trafienia</div>
              <div className="text-sm font-black text-violet-400 mt-0.5">{stats.correctGuesses}</div>
            </div>
          </div>
        </div>

        {/* Opcja awaryjna */}
        <div className="text-center">
          <button
            onClick={() => setShowImportModal(true)}
            className="text-[10px] text-slate-500 hover:text-slate-400 underline"
          >
            Prywatne polubienia? Wgraj archiwum user_data.json
          </button>
        </div>
      </main>

      {/* Stopka */}
      <footer className="w-full text-center py-1 text-[10px] text-slate-600 font-medium flex-shrink-0">
        Pionkiii ♟️ • Szybka gra towarzyska
      </footer>

      {/* Modal Awatara */}
      {showAvatarPicker && (
        <AvatarPicker
          userId={profile.id}
          currentAvatarId={profile.avatarId}
          currentBgColor={profile.avatarBg}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Modal Zasad */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              ♟️ Zasady gry Pionkiii
            </h2>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="font-black text-white flex items-center gap-1 mb-0.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  1. Oglądaj i zgaduj (20 Rund)
                </div>
                Oglądasz prawdziwy film polubiony przez jednego z graczy w pokoju. Zgadnij, czyj to gust!
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="font-black text-white flex items-center gap-1 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  2. Szybkość reakcji (+50 do +200 pkt)
                </div>
                Im szybciej oddasz poprawny głos, tym większy bonus zgarniasz.
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="font-black text-white flex items-center gap-1 mb-0.5">
                  <Award className="w-3.5 h-3.5 text-violet-400" />
                  3. Bonus Niewidzialności (+300 pkt)
                </div>
                Gdy leci Twój film, zachowaj pokerową twarz 🤫! Jeśli nikt Cię nie odgadnie, dostajesz bonus.
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="font-black text-white flex items-center gap-1 mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  4. Serie & Rundy Finałowe x2
                </div>
                Seria trafień mnoży punkty (aż do x3). W rundach 16–20 wszystkie punkty mnożą się przez 2!
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="mt-3 w-full py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs"
            >
              Rozumiem, gramy!
            </button>
          </div>
        </div>
      )}

      {/* Modal Importu */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              Import user_data.json
            </h3>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Wklej treść pliku JSON..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-400"
              >
                Anuluj
              </button>
              <button
                disabled={importing || !jsonText.trim()}
                onClick={handleJsonUpload}
                className="px-4 py-1.5 text-xs font-black bg-emerald-500 text-slate-950 rounded-xl disabled:opacity-50"
              >
                {importing ? 'Import...' : 'Zaimportuj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
