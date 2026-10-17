import React, { useState } from 'react';
import { X, Check, Camera, Sparkles, Loader2 } from 'lucide-react';

export const AVATAR_PRESETS = [
  { id: 'pawn_classic', icon: '♟️', name: 'Pionek' },
  { id: 'crown_gold', icon: '👑', name: 'Korona' },
  { id: 'knight_tactics', icon: '♞', name: 'Skoczek' },
  { id: 'rook_fortress', icon: '♜', name: 'Wieża' },
  { id: 'king_royalty', icon: '♚', name: 'Król' },
  { id: 'fire_streak', icon: '🔥', name: 'Ogień' },
  { id: 'detective_investigator', icon: '🕵️', name: 'Detektyw' },
  { id: 'ninja_stealth', icon: '🥷', name: 'Ninja' },
  { id: 'ghost_sneaky', icon: '👻', name: 'Duch' },
  { id: 'diamond_gem', icon: '💎', name: 'Diament' },
  { id: 'skull_deadly', icon: '💀', name: 'Czaszka' },
  { id: 'star_champion', icon: '⭐', name: 'Gwiazda' },
  { id: 'fox_cunning', icon: '🦊', name: 'Lis' },
  { id: 'cat_chilled', icon: '🐱', name: 'Kot' },
  { id: 'robot_cyber', icon: '🤖', name: 'Robot' },
  { id: 'rocket_speed', icon: '🚀', name: 'Rakieta' },
  { id: 'lightning_strike', icon: '⚡', name: 'Błysk' },
  { id: 'gamepad_gamer', icon: '🎮', name: 'Gamer' },
];

export const BG_COLORS = [
  { id: 'emerald', hex: '#10b981' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'rose', hex: '#f43f5e' },
  { id: 'cyan', hex: '#06b6d4' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'pink', hex: '#ec4899' },
  { id: 'slate', hex: '#334155' },
];

interface AvatarPickerProps {
  userId: string;
  currentAvatarId: string;
  currentBgColor: string;
  onSave: (avatarId: string, bgColor: string) => void;
  onClose: () => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  userId,
  currentAvatarId,
  currentBgColor,
  onSave,
  onClose,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarId);
  const [selectedBg, setSelectedBg] = useState(currentBgColor);
  const [isUploading, setIsUploading] = useState(false);

  // Bezpieczna kompresja i upload na serwer (brak problemów z WebSocketem)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = 160; // 160x160 px idealne na miniaturkę awatara
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Centrowane kadrowanie
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const base64 = canvas.toDataURL('image/jpeg', 0.82);

          try {
            // Wyślij do dedykowanego endpointu
            const res = await fetch('/api/avatar/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, imageBase64: base64 }),
            });
            const data = await res.json();
            if (data.success && data.avatarUrl) {
              setSelectedAvatar(data.avatarUrl);
            } else {
              // Fallback na base64 jeśli API niedostępne
              setSelectedAvatar(base64);
            }
          } catch (err) {
            setSelectedAvatar(base64);
          }
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const isCustom = selectedAvatar.startsWith('data:image') || selectedAvatar.startsWith('/api/avatar');
  const activePreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-4 shadow-2xl relative flex flex-col max-h-[90dvh]">
        {/* Pasek górny */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-black text-white">Twój Awatar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Podgląd na żywo */}
        <div className="flex items-center justify-center py-3 gap-3 bg-slate-950/70 rounded-2xl my-2 border border-slate-800">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/20 overflow-hidden relative flex-shrink-0"
            style={{ backgroundColor: selectedBg }}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            ) : isCustom ? (
              <img src={selectedAvatar} alt="Awatar" className="w-full h-full object-cover" />
            ) : (
              <span>{activePreset?.icon || '♟️'}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
              Podgląd w grze
            </div>
            <div className="text-sm font-black text-white">
              {isCustom ? 'Własne zdjęcie 📸' : activePreset?.name || 'Pionek'}
            </div>
          </div>
        </div>

        {/* Zawartość wyboru */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          {/* Przycisk dodania zdjęcia z telefonu */}
          <label className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl cursor-pointer text-xs font-black text-emerald-300 transition-all shadow active:scale-95 text-center">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>{isUploading ? 'Przesyłanie...' : 'Wybierz zdjęcie z galerii telefonu 📷'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {/* Presety */}
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              LUB wybierz ikonę
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedAvatar(preset.id)}
                    className={`h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                      isSelected
                        ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-105'
                        : 'bg-slate-800/80 border border-slate-700/60'
                    }`}
                  >
                    {preset.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolory tła */}
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              Kolor tła
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.hex)}
                  className={`h-7 rounded-xl flex items-center justify-center transition-all ${
                    selectedBg === bg.hex
                      ? 'ring-2 ring-white scale-110'
                      : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: bg.hex }}
                >
                  {selectedBg === bg.hex && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dolne przyciski */}
        <div className="pt-2 mt-2 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            Anuluj
          </button>
          <button
            disabled={isUploading}
            onClick={() => {
              onSave(selectedAvatar, selectedBg);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow transition-transform active:scale-95 disabled:opacity-50"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};
