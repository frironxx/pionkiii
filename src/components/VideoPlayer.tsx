import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, AlertCircle, Play } from 'lucide-react';

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

  // Odczytaj preferencję dźwięku z pamięci
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('pionkiii_sound_enabled') !== 'true';
  });
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;

      // Spróbuj odtworzyć z dźwiękiem jeśli użytkownik go włączył
      const soundWanted = localStorage.getItem('pionkiii_sound_enabled') === 'true';
      videoRef.current.muted = !soundWanted;
      setIsMuted(!soundWanted);

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setHasStarted(true))
          .catch((err) => {
            console.warn('[Video] Przeglądarka zablokowała autoodtwarzanie z dźwiękiem:', err);
            // Fallback na wyciszone
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setHasStarted(true));
            }
          });
      }
    }
  }, [streamUrl]);

  // Ciche preładowanie kolejnego filmu
  useEffect(() => {
    if (nextVideoUrl && nextVideoRef.current) {
      nextVideoRef.current.src = nextVideoUrl;
      nextVideoRef.current.load();
    }
  }, [nextVideoUrl]);

  // Włączenie/wyłączenie dźwięku (zapisywane na stałe)
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
      }
    }
  };

  return (
    <div
      onClick={() => toggleSound()}
      className="relative w-full h-full max-h-[58dvh] sm:max-h-[64dvh] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800/80 flex items-center justify-center cursor-pointer select-none group"
    >
      {/* Wideo bez żadnych ucięć */}
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
        className="w-full h-full object-contain bg-black"
      />

      {/* Ukryty preloader kolejnej rundy */}
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

      {/* Pływający przycisk dźwięku w prawym górnym rogu */}
      <button
        onClick={toggleSound}
        className="absolute top-2.5 right-2.5 z-30 p-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-lg transition-transform active:scale-90"
        title={isMuted ? 'Dotknij, aby włączyć dźwięk' : 'Wycisz'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-amber-400" />
        ) : (
          <Volume2 className="w-5 h-5 text-emerald-400" />
        )}
      </button>

      {/* Wyraźna plakietka zachęcająca do włączenia dźwięku na telefonie */}
      {isMuted && (
        <div
          onClick={toggleSound}
          className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[11px] font-bold shadow-lg animate-pulse"
        >
          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          <span>Dotknij, aby włączyć dźwięk 🔊</span>
        </div>
      )}

      {/* Błąd odtwarzania */}
      {hasError && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs font-bold text-white">Ładowanie wideo...</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.load();
              setHasError(false);
            }}
            className="mt-2 px-3 py-1 text-xs bg-slate-800 text-slate-200 rounded-lg"
          >
            Odśwież
          </button>
        </div>
      )}
    </div>
  );
};
