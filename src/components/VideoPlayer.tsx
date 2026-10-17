import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  coverUrl?: string;
  nextVideoUrl?: string | null;
  isOwner?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  coverUrl,
  nextVideoUrl,
  isOwner,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('pionkiii_sound_enabled') !== 'true';
  });
  const [hasError, setHasError] = useState(false);
  const [showSoundToast, setShowSoundToast] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;

      const soundWanted = localStorage.getItem('pionkiii_sound_enabled') === 'true';
      videoRef.current.muted = !soundWanted;
      videoRef.current.volume = 1.0;
      setIsMuted(!soundWanted);

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Jeśli autoplay z dźwiękiem zablokowany przez przeglądarkę, odpal wyciszone
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [streamUrl]);

  // Cichy preloader następnej rundy
  useEffect(() => {
    if (nextVideoUrl && nextVideoRef.current) {
      nextVideoRef.current.src = nextVideoUrl;
      nextVideoRef.current.load();
    }
  }, [nextVideoUrl]);

  const toggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = 1.0;
      setIsMuted(nextMuted);
      localStorage.setItem('pionkiii_sound_enabled', nextMuted ? 'false' : 'true');

      if (!nextMuted) {
        videoRef.current.play().catch(() => {});
        setShowSoundToast(true);
        setTimeout(() => setShowSoundToast(false), 2000);
      }
    }
  };

  return (
    <div
      onClick={() => toggleSound()}
      className="relative h-full max-h-full aspect-[9/16] w-auto max-w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center cursor-pointer select-none group"
    >
      {/* Czyste wideo bez obcięć */}
      <video
        ref={videoRef}
        src={streamUrl}
        poster={coverUrl}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        loop
        autoPlay
        muted={isMuted}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain bg-black pointer-events-none"
      />

      {/* Ukryty preloader */}
      {nextVideoUrl && (
        <video
          ref={nextVideoRef}
          preload="auto"
          muted
          playsInline
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Pływający przycisk dźwięku */}
      <button
        onClick={toggleSound}
        className={`absolute top-2.5 right-2.5 z-30 p-2.5 rounded-full backdrop-blur-md border shadow-xl transition-transform active:scale-90 ${
          isMuted
            ? 'bg-amber-500/80 border-amber-300 text-slate-950 animate-pulse'
            : 'bg-black/60 border-white/20 text-emerald-400'
        }`}
        title={isMuted ? 'Dotknij, aby włączyć dźwięk' : 'Wycisz'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 stroke-[2.5]" />
        ) : (
          <Volume2 className="w-5 h-5 stroke-[2.5]" />
        )}
      </button>

      {/* Duża pulsująca plakietka na górze wideo gdy wyciszone */}
      {isMuted && (
        <div
          onClick={toggleSound}
          className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-400/60 text-amber-300 text-xs font-black shadow-xl"
        >
          <VolumeX className="w-4 h-4 text-amber-400" />
          <span>DOTKNIJ EKRANU = DŹWIĘK 🔊</span>
        </div>
      )}

      {/* Krótki toast potwierdzenia dźwięku */}
      {showSoundToast && (
        <div className="absolute center z-30 px-4 py-2 rounded-2xl bg-emerald-500/90 text-slate-950 text-xs font-black shadow-2xl animate-fade-in pointer-events-none">
          Dźwięk włączony! 🔊
        </div>
      )}

      {/* Błąd odtwarzania */}
      {hasError && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs font-bold text-white">Buforowanie strumienia...</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.load();
              setHasError(false);
            }}
            className="mt-2 px-3 py-1 text-xs bg-slate-800 text-slate-200 rounded-lg"
          >
            Odśwież wideo
          </button>
        </div>
      )}
    </div>
  );
};
