import React, { useState } from 'react';
import { X, Check, Upload, Sparkles } from 'lucide-react';

export const AVATAR_PRESETS = [
  { id: 'pawn_classic', icon: '♟️', name: 'Klasyczny Pionek' },
  { id: 'crown_gold', icon: '👑', name: 'Złota Korona' },
  { id: 'knight_tactics', icon: '♞', name: 'Sprytny Skoczek' },
  { id: 'rook_fortress', icon: '♜', name: 'Ciężka Wieża' },
  { id: 'king_royalty', icon: '♚', name: 'Król Szachów' },
  { id: 'fire_streak', icon: '🔥', name: 'Ognista Seria' },
  { id: 'detective_investigator', icon: '🕵️', name: 'TikTok Detektyw' },
  { id: 'ninja_stealth', icon: '🥷', name: 'Mistrz Niewidzialności' },
  { id: 'ghost_sneaky', icon: '👻', name: 'Duch Poker Face' },
  { id: 'diamond_gem', icon: '💎', name: 'Diament' },
  { id: 'skull_deadly', icon: '💀', name: 'Czaszka' },
  { id: 'star_champion', icon: '⭐', name: 'Gwiazda' },
  { id: 'fox_cunning', icon: '🦊', name: 'Przebiegły Lis' },
  { id: 'cat_chilled', icon: '🐱', name: 'Wyluzowany Kot' },
  { id: 'robot_cyber', icon: '🤖', name: 'Cyborg Bot' },
  { id: 'rocket_speed', icon: '🚀', name: 'Rakieta' },
  { id: 'lightning_strike', icon: '⚡', name: 'Błyskawica' },
  { id: 'gamepad_gamer', icon: '🎮', name: 'Pro Gracz' },
];

export const BG_COLORS = [
  { id: 'emerald', hex: '#10b981', name: 'Szmaragd' },
  { id: 'amber', hex: '#f59e0b', name: 'Bursztyn' },
  { id: 'violet', hex: '#8b5cf6', name: 'Fiolet' },
  { id: 'rose', hex: '#f43f5e', name: 'Rubin' },
  { id: 'cyan', hex: '#06b6d4', name: 'Cyjan' },
  { id: 'blue', hex: '#3b82f6', name: 'Szafir' },
  { id: 'pink', hex: '#ec4899', name: 'Róż' },
  { id: 'slate', hex: '#334155', name: 'Ciemny Łupkowy' },
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
  const [customImage, setCustomImage] = useState<string | null>(
    currentAvatarId.startsWith('data:image') ? currentAvatarId : null
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Plik jest za duży (maksymalnie 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCustomImage(result);
        setSelectedAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const activePreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Nagłówek */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Wybierz swój Awatar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Podgląd na żywo */}
        <div className="flex items-center justify-center py-6 gap-6 bg-slate-950/60 rounded-xl my-4 border border-slate-800/80">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-2 border-white/20 transition-all transform hover:scale-105"
            style={{ backgroundColor: selectedBg }}
          >
            {customImage && selectedAvatar === customImage ? (
              <img src={customImage} alt="Awatar" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span>{activePreset?.icon || '♟️'}</span>
            )}
          </div>
          <div>
            <div className="text-sm text-slate-400 uppercase font-semibold tracking-wider">
              Podgląd w grze
            </div>
            <div className="text-lg font-bold text-white">
              {customImage && selectedAvatar === customImage
                ? 'Własne zdjęcie'
                : activePreset?.name || 'Pionek'}
            </div>
          </div>
        </div>

        {/* Sekcja wyboru ikon */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Gotowe ikony (18 presetów)
            </div>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedAvatar(preset.id);
                      setCustomImage(null);
                    }}
                    className={`h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105'
                        : 'bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50'
                    }`}
                    title={preset.name}
                  >
                    {preset.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolor tła */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Kolor tła awatara
            </div>
            <div className="grid grid-cols-8 gap-2">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.hex)}
                  className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                    selectedBg === bg.hex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: bg.hex }}
                  title={bg.name}
                >
                  {selectedBg === bg.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Własne zdjęcie */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              LUB wgraj własne zdjęcie
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 rounded-xl cursor-pointer text-sm font-medium text-slate-300 hover:text-white transition-all">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Wybierz plik z dysku (PNG / JPG)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Przyciski dolne */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={() => {
              onSave(selectedAvatar, selectedBg);
              onClose();
            }}
            className="px-5 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
          >
            Zapisz awatar
          </button>
        </div>
      </div>
    </div>
  );
};
