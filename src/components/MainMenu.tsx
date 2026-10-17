import React, { useState } from 'react';
import { UserProfile, UserStats } from '../types';
import { AvatarPicker, AVATAR_PRESETS } from './AvatarPicker';
import { Play, Trophy, HelpCircle, User, Flame, CheckCircle2, Award, Zap, Upload } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 md:p-8 text-slate-100 max-w-4xl mx-auto">
      {/* Pasek górny */}
      <header className="w-full flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner shadow-emerald-500/20">
            ♟️
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Pionkiii
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                v1.0 PL
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Party Game: Kto polubił ten film?</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Zasady</span>
          </button>
        </div>
      </header>

      {/* Główna sekcja */}
      <main className="w-full flex-1 flex flex-col justify-center items-center my-6 space-y-8 max-w-xl">
        {/* Karta Profilu */}
        <div className="w-full glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Awatar z przyciskiem zmiany */}
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-xl border-2 border-white/20 transition-transform group-hover:scale-105"
                style={{ backgroundColor: profile.avatarBg }}
              >
                {isCustomImg ? (
                  <img
                    src={profile.avatarId}
                    alt="Awatar"
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <span>{activePreset?.icon || '♟️'}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shadow">
                ZMIEŃ
              </div>
            </div>

            {/* Pola danych: TikTok i Nick */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Twoja nazwa TikTok (@username)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold select-none">@</span>
                  <input
                    type="text"
                    value={tiktokInput}
                    onChange={(e) => setTiktokInput(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="friron411k"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  Twój nick w grze
                </label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Mistrz TikToka"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wielki przycisk GRAJ */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={onStartMatchmaking}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-2xl tracking-wider uppercase shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <Play className="w-7 h-7 fill-slate-950" />
            <span>GRAJ</span>
          </button>
          <p className="text-xs text-slate-400 font-medium text-center">
            Automatyczne dobieranie graczy • Pokoje od 3 do 4 osób
          </p>
        </div>

        {/* Dashboard Statystyk */}
        <div className="w-full glass-panel rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Twoje Statystyki
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Zsynchronizowano</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Rozegrane gry</span>
              <span className="text-xl font-black text-white mt-1">{stats.gamesPlayed}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Wygrane gry</span>
              <span className="text-xl font-black text-emerald-400 mt-1">{stats.gamesWon}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Zdobyte punkty</span>
              <span className="text-xl font-black text-amber-400 mt-1">
                {stats.totalPoints.toLocaleString('pl-PL')}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Odgadnięte</span>
              <span className="text-xl font-black text-violet-400 mt-1">{stats.correctGuesses}</span>
            </div>
          </div>
        </div>

        {/* Opcja awaryjna dla prywatnych kont */}
        <div className="pt-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            Masz prywatne polubienia na TikToku? Wgraj archiwum user_data.json
          </button>
        </div>
      </main>

      {/* Stopka */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium">
        Pionkiii ♟️ • Błyskawiczna gra towarzyska na żywo
      </footer>

      {/* Modal Awatara */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarId={profile.avatarId}
          currentBgColor={profile.avatarBg}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Modal Zasad Gry */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl">
            <h2 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
              ♟️ Jak grać w Pionkiii?
            </h2>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Play className="w-4 h-4 text-emerald-400" />
                  1. Oglądaj i zgaduj (20 Rund)
                </div>
                Oglądasz prawdziwy polubiony film jednego z graczy w pokoju. Twoim celem jest wskazać, czyj to gust!
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  2. Szybkość reakcji (+50 do +200 pkt)
                </div>
                Im szybciej oddasz prawidłowy głos, tym więcej punktów bonusowych wpada na Twoje konto.
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Award className="w-4 h-4 text-violet-400" />
                  3. Bonus Niewidzialności (+250 do +400 pkt)
                </div>
                Gdy leci Twój film, zachowaj pokerową twarz 🤫! Jeśli <strong>NIKT</strong> w pokoju Cię nie
                rozszyfruje, zgarniasz potężny bonus punktowy!
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-rose-400" />
                  4. Serie Trafień & Rundy Finałowe x2
                </div>
                Kolejne trafienia mnożą punkty (aż do 3x za płomienną serię 🔥). W rundach 16–20 wszystkie punkty
                mnożą się przez 2, pozwalając osiągnąć pułap 15 000 – 20 000 pkt!
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              Rozumiem, gramy!
            </button>
          </div>
        </div>
      )}

      {/* Modal Awaryjnego Importu JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Import pliku user_data.json
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Jeżeli Twoje polubienia na profilu TikToka są prywatne, możesz wkleić zawartość pobranego z aplikacji pliku
              JSON.
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Wklej zawartość pliku user_data.json tutaj..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                disabled={importing || !jsonText.trim()}
                onClick={handleJsonUpload}
                className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl disabled:opacity-50"
              >
                {importing ? 'Importowanie...' : 'Zaimportuj polubienia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
