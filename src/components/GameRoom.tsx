import React, { useState, useEffect } from 'react';
import { RoundStartPayload, RoundResult, LeaderboardEntry, Player } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { VotingOverlay } from './VotingOverlay';
import { RevealScreen } from './RevealScreen';
import { Leaderboard } from './Leaderboard';
import { Flame } from 'lucide-react';

interface GameRoomProps {
  roundData: RoundStartPayload | null;
  roundResult: RoundResult | null;
  standings: LeaderboardEntry[];
  players: Player[];
  myUserId: string;
  phase: 'ROUND_VOTING' | 'ROUND_REVEAL_VOTES' | 'ROUND_REVEAL_OWNER' | 'ROUND_INTERMISSION';
  nextRoundInSeconds: number;
  onCastVote: (votedUserId: string) => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({
  roundData,
  roundResult,
  standings,
  players,
  myUserId,
  phase,
  nextRoundInSeconds,
  onCastVote,
}) => {
  const [timeLeft, setTimeLeft] = useState(18);

  useEffect(() => {
    if (!roundData || phase !== 'ROUND_VOTING') return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((roundData.deadline - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 250);
    return () => clearInterval(interval);
  }, [roundData, phase]);

  if (!roundData) {
    return (
      <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Przygotowywanie rundy...</span>
        </div>
      </div>
    );
  }

  const isVoting = phase === 'ROUND_VOTING';
  const isReveal = phase === 'ROUND_REVEAL_VOTES' || phase === 'ROUND_REVEAL_OWNER';
  const isIntermission = phase === 'ROUND_INTERMISSION';

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden p-2 sm:p-4 select-none">
      {/* Pasek Górny (Kompaktowy) */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between py-1 px-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">♟️</span>
          <div className="text-xs font-black text-white">
            Runda <span className="text-emerald-400">{roundData.roundNumber}</span>/{roundData.totalRounds}
          </div>
        </div>

        {/* Znacznik Rundy Finałowej x2 */}
        {roundData.isClutch ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <Flame className="w-3 h-3 fill-amber-400" />
            <span>FINAŁ x2!</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-bold">
            Pionkiii ♟️
          </div>
        )}
      </header>

      {/* Środek: Wideo LUB Tabela Wyników */}
      <main className="w-full flex-1 flex flex-col justify-center items-center min-h-0 py-1 overflow-hidden">
        {isIntermission ? (
          <Leaderboard
            roundNumber={roundData.roundNumber}
            totalRounds={roundData.totalRounds}
            standings={standings}
            myUserId={myUserId}
            nextRoundInSeconds={nextRoundInSeconds}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center min-h-0">
            <VideoPlayer
              streamUrl={roundData.video.streamUrl}
              coverUrl={roundData.video.coverUrl}
              nextVideoUrl={roundData.nextVideoUrl}
              isOwner={roundData.isOwner}
            />
          </div>
        )}
      </main>

      {/* Dolny panel interakcji: Głosowanie lub Odkrycie (Zawsze mieści się na ekranie) */}
      <footer className="w-full max-w-lg mx-auto flex-shrink-0 pt-1 pb-1">
        {isVoting && (
          <VotingOverlay
            candidates={roundData.candidates}
            myUserId={myUserId}
            isOwner={roundData.isOwner}
            timeLeftSeconds={timeLeft}
            totalDurationSeconds={Math.round(roundData.durationMs / 1000)}
            isClutch={roundData.isClutch}
            onCastVote={onCastVote}
          />
        )}

        {isReveal && (
          <RevealScreen
            phase={phase}
            result={roundResult}
            players={players}
            myUserId={myUserId}
          />
        )}

        {isIntermission && (
          <div className="text-center text-[10px] text-slate-500 font-medium py-1">
            Kolejna runda za chwilę...
          </div>
        )}
      </footer>
    </div>
  );
};
