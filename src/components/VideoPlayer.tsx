import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  coverUrl?: string;
  nextVideoUrl?: string | null;
  authorNickname?: string;
  description?: string;
  isOwner?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  coverUrl,
  nextVideoUrl,
  authorNickname,
  description,
  isOwner,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('[Video] Autoplay zablokowany, odtwarzanie wyciszone:', e);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true));
          }
        });
    }
  }, [streamUrl]);

  // Ciche preładowanie kolejnego filmu w tle (Zero-Latency Engine)
  useEffect(() => {
    if (nextVideoUrl && nextVideoRef.current) {
      nextVideoRef.current.src = nextVideoUrl;
      nextVideoRef.current.load();
      console.log('[Preloader] Ciche buforowanie kolejnej rundy:', nextVideoUrl.substring(0, 60));
    }
  }, [nextVideoUrl]);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
      if (nextMute === false) {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center group mx-auto">
      {/* Główny element wideo */}
      <video
        ref={videoRef}
        src={streamUrl}
        poster={coverUrl}
        playsInline
        loop
        autoPlay
        muted={isMuted}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />

      {/* Ukryty element buforujący następną rundę (Zero-Latency Preloader) */}
      {nextVideoUrl && (
        <video
          ref={nextVideoRef}
          preload="auto"
          muted
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Nakładka błędu w razie problemów z łączem */}
      {hasError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <p className="text-sm font-bold text-white">Buforowanie strumienia...</p>
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.load();
              setHasError(false);
            }}
            className="mt-3 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Przełącznik dźwięku */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-transform active:scale-90"
        title={isMuted ? 'Włącz dźwięk' : 'Wycisz dźwięk'}
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-amber-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
      </button>

      {/* Dyskretna informacja o twórcy TikToka */}
      {authorNickname && (
        <div className="absolute bottom-3 left-3 right-3 z-10 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-left pointer-events-none">
          <div className="text-[11px] font-bold text-emerald-400 truncate">@{authorNickname}</div>
          {description && (
            <div className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">{description}</div>
          )}
        </div>
      )}
    </div>
  );
};
