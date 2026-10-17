import React, { useState } from 'react';
import { X, Check, Camera, Image, Sparkles } from 'lucide-react';

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
  currentAvatarId: string;
  currentBgColor: string;
  onSave: (avatarId: string, bgColor: string) => void;
  onClose: () => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatarId,
  currentBgColor,
  onSave,
  onClose,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarId);
  const [selectedBg, setSelectedBg] = useState(currentBgColor);
  const [isCompressing, setIsCompressing] = useState(false);

  // Kompresja zdjęcia na telefonie (do 200x200px, waga ~15-25KB)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 220;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const isCustom = selectedAvatar.startsWith('data:image');
  const activePreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-5 shadow-2xl relative flex flex-col max-h-[92dvh]">
        {/* Pasek górny */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Twój Awatar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Podgląd na żywo */}
        <div className="flex items-center justify-center py-4 gap-4 bg-slate-950/70 rounded-2xl my-3 border border-slate-800">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/20 overflow-hidden"
            style={{ backgroundColor: selectedBg }}
          >
            {isCustom ? (
              <img src={selectedAvatar} alt="Awatar" className="w-full h-full object-cover" />
            ) : (
              <span>{activePreset?.icon || '♟️'}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
              Podgląd w grze
            </div>
            <div className="text-base font-bold text-white">
              {isCustom ? 'Własne zdjęcie z telefonu 📸' : activePreset?.name || 'Pionek'}
            </div>
          </div>
        </div>

        {/* Zawartość z wyborem */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {/* Przycisk: Wgraj własne zdjęcie z galerii */}
          <div>
            <label className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl cursor-pointer text-xs font-bold text-emerald-300 transition-all shadow-md active:scale-95">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{isCompressing ? 'Przetwarzanie zdjęcia...' : 'Dodaj zdjęcie z galerii telefonu 📷'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </label>
          </div>

          {/* Gotowe ikony */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              LUB wybierz gotową ikonę
            </div>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedAvatar(preset.id)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      isSelected
                        ? 'bg-emerald-500/25 border-2 border-emerald-400 scale-105'
                        : 'bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60'
                    }`}
                  >
                    {preset.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolor tła */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Kolor tła
            </div>
            <div className="grid grid-cols-8 gap-2">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.hex)}
                  className={`h-8 rounded-xl flex items-center justify-center transition-all ${
                    selectedBg === bg.hex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: bg.hex }}
                >
                  {selectedBg === bg.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dolne przyciski */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            Anuluj
          </button>
          <button
            onClick={() => {
              onSave(selectedAvatar, selectedBg);
              onClose();
            }}
            className="px-5 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};
