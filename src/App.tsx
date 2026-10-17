import React, { useState, useEffect } from 'react';
import { socketService } from './services/socket';
import { storage } from './services/storage';
import {
  UserProfile,
  UserStats,
  RoomStatus,
  Player,
  RoundStartPayload,
  RoundResult,
  LeaderboardEntry,
} from './types';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { EndScreen } from './components/EndScreen';

export function App() {
  const [profile, setProfile] = useState<UserProfile>(storage.getUserProfile());
  const [stats, setStats] = useState<UserStats>(storage.getUserStats());

  const [roomStatus, setRoomStatus] = useState<RoomStatus>('MENU');
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);

  // In-Game State
  const [roundData, setRoundData] = useState<RoundStartPayload | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [nextRoundInSeconds, setNextRoundInSeconds] = useState<number>(3);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  useEffect(() => {
    // Synchronizuj profil i statystyki z serwerem przy wejściu
    storage.syncWithServer(profile).then(({ profile: syncedP, stats: syncedS }) => {
      setProfile(syncedP);
      setStats(syncedS);
    });

    const socket = socketService.connect();

    // Nasłuchiwanie stanu pokoju
    socket.on('room_state_update', (data) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setCountdownSeconds(data.countdownSeconds || 3);

      if (data.status === 'LOBBY' || data.status === 'STARTING_COUNTDOWN') {
        setRoomStatus(data.status);
      }
    });

    socket.on('countdown_tick', (data) => {
      setCountdownSeconds(data.seconds);
    });

    socket.on('loading_deck', (data) => {
      setLoadingMessage(data.message);
    });

    socket.on('round_started', (data: RoundStartPayload) => {
      setLoadingMessage(null);
      setRoundData(data);
      setRoundResult(null);
      setRoomStatus('ROUND_VOTING');
    });

    socket.on('reveal_votes_phase', (data) => {
      setRoomStatus('ROUND_REVEAL_VOTES');
    });

    socket.on('reveal_owner_phase', (data) => {
      setRoundResult(data.result);
      setStandings(data.standings);
      setRoomStatus('ROUND_REVEAL_OWNER');
    });

    socket.on('round_intermission', (data) => {
      setStandings(data.standings);
      setNextRoundInSeconds(data.nextRoundIn || 3);
      setRoomStatus('ROUND_INTERMISSION');
    });

    socket.on('game_over', (data) => {
      setStandings(data.standings);
      setRoomStatus('MATCH_OVER');

      // Odśwież lokalne statystyki po meczu
      storage.syncWithServer(profile).then(({ stats: newStats }) => {
        setStats(newStats);
      });
    });

    socket.on('error_message', (data) => {
      alert(data.message);
      setLoadingMessage(null);
    });

    return () => {
      socket.off('room_state_update');
      socket.off('countdown_tick');
      socket.off('loading_deck');
      socket.off('round_started');
      socket.off('reveal_votes_phase');
      socket.off('reveal_owner_phase');
      socket.off('round_intermission');
      socket.off('game_over');
      socket.off('error_message');
    };
  }, []);

  // Aktualizacja profilu (menu lub lobby)
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storage.saveUserProfile(newProfile);
    storage.syncWithServer(newProfile);

    // Zaktualizuj na serwerze w aktywnym pokoju
    const socket = socketService.getSocket();
    socket.emit('update_profile', {
      displayName: newProfile.displayName,
      avatarId: newProfile.avatarId,
      avatarBg: newProfile.avatarBg,
    });
  };

  // Start dobierania graczy (Kliknięcie "GRAJ")
  const handleStartMatchmaking = () => {
    const socket = socketService.getSocket();
    socket.emit('join_game', {
      userId: profile.id,
      tiktokUsername: profile.tiktokUsername,
      displayName: profile.displayName,
      avatarId: profile.avatarId,
      avatarBg: profile.avatarBg,
    });
    setRoomStatus('LOBBY');
  };

  // Przełącznik "GOTOWY" w lobby
  const handleToggleReady = () => {
    const socket = socketService.getSocket();
    socket.emit('toggle_ready');
  };

  // Oddanie głosu
  const handleCastVote = (votedUserId: string) => {
    const socket = socketService.getSocket();
    socket.emit('cast_vote', { votedForUserId: votedUserId });
  };

  // Wyjście z pokoju
  const handleLeaveGame = () => {
    const socket = socketService.getSocket();
    socket.emit('leave_game');
    setRoomStatus('MENU');
    setRoundData(null);
    setRoundResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ekran ładowania talii */}
      {loadingMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-black text-white">{loadingMessage}</h3>
          <p className="text-xs text-slate-400 mt-2">
            Przygotowujemy bezpośrednie strumienie wideo i algorytm 80/20...
          </p>
        </div>
      )}

      {/* Wybór widoku na podstawie stanu pokoju */}
      {roomStatus === 'MENU' && (
        <MainMenu
          profile={profile}
          stats={stats}
          onUpdateProfile={handleUpdateProfile}
          onStartMatchmaking={handleStartMatchmaking}
          onImportJsonSuccess={(count) => {
            alert(`Pomyślnie zaimportowano ${count} filmów z archiwum!`);
          }}
        />
      )}

      {(roomStatus === 'LOBBY' || roomStatus === 'STARTING_COUNTDOWN') && (
        <Lobby
          roomId={roomId}
          players={players}
          myUserId={profile.id}
          countdownSeconds={countdownSeconds}
          isStarting={roomStatus === 'STARTING_COUNTDOWN'}
          onToggleReady={handleToggleReady}
          onUpdateProfile={(updates) => {
            handleUpdateProfile({
              ...profile,
              ...updates,
            });
          }}
          onLeave={handleLeaveGame}
        />
      )}

      {(roomStatus === 'ROUND_VOTING' ||
        roomStatus === 'ROUND_REVEAL_VOTES' ||
        roomStatus === 'ROUND_REVEAL_OWNER' ||
        roomStatus === 'ROUND_INTERMISSION') && (
        <GameRoom
          roundData={roundData}
          roundResult={roundResult}
          standings={standings}
          players={players}
          myUserId={profile.id}
          phase={roomStatus}
          nextRoundInSeconds={nextRoundInSeconds}
          onCastVote={handleCastVote}
        />
      )}

      {roomStatus === 'MATCH_OVER' && (
        <EndScreen
          standings={standings}
          myUserId={profile.id}
          totalRounds={20}
          onPlayAgain={handleStartMatchmaking}
          onBackToMenu={handleLeaveGame}
        />
      )}
    </div>
  );
}

export default App;
