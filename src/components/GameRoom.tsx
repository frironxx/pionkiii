import React, { useState, useEffect } from 'react';
import { RoundStartPayload, RoundResult, LeaderboardEntry, Player } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { VotingOverlay } from './VotingOverlay';
import { RevealScreen } from './RevealScreen';
import { Leaderboard } from './Leaderboard';
import { Flame, Trophy } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold">Przygotowywanie rundy...</span>
        </div>
      </div>
    );
  }

  const isVoting = phase === 'ROUND_VOTING';
  const isReveal = phase === 'ROUND_REVEAL_VOTES' || phase === 'ROUND_REVEAL_OWNER';
  const isIntermission = phase === 'ROUND_INTERMISSION';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-3 sm:p-6 text-slate-100 max-w-4xl mx-auto">
      {/* Pasek Górny */}
      <header className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-lg">♟️</span>
          <div className="text-sm font-black text-white">
            Runda <span className="text-emerald-400">{roundData.roundNumber}</span> z {roundData.totalRounds}
          </div>
        </div>

        {/* Znacznik Rundy Finałowej x2 */}
        {roundData.isClutch ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>Rundy Finałowe x2!</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-slate-500" />
            <span>Zgadnij polubienie</span>
          </div>
        )}
      </header>

      {/* Środek: Wideo lub Tablica Intermisji */}
      <main className="w-full flex-1 flex flex-col justify-center items-center my-3 max-w-xl">
        {isIntermission ? (
          <Leaderboard
            roundNumber={roundData.roundNumber}
            totalRounds={roundData.totalRounds}
            standings={standings}
            myUserId={myUserId}
            nextRoundInSeconds={nextRoundInSeconds}
          />
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            {/* Odtwarzacz wideo z bezstratnym preloaderem */}
            <VideoPlayer
              streamUrl={roundData.video.streamUrl}
              coverUrl={roundData.video.coverUrl}
              nextVideoUrl={roundData.nextVideoUrl}
              authorNickname={roundData.video.authorNickname}
              description={roundData.video.description}
              isOwner={roundData.isOwner}
            />

            {/* Faza głosowania */}
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

            {/* Faza odkrywania */}
            {isReveal && (
              <RevealScreen
                phase={phase}
                result={roundResult}
                players={players}
                myUserId={myUserId}
              />
            )}
          </div>
        )}
      </main>

      {/* Stopka */}
      <footer className="w-full text-center py-1 text-[11px] text-slate-500 font-medium">
        Pionkiii ♟️ • Runda {roundData.roundNumber} z {roundData.totalRounds}
      </footer>
    </div>
  );
};
