import { Server, Socket } from 'socket.io';
import { db, CachedLikedVideo } from './db.js';
import { TikTokService } from './tiktok.js';

export type RoomStatus =
  | 'LOBBY'
  | 'STARTING_COUNTDOWN'
  | 'ROUND_VOTING'
  | 'ROUND_REVEAL_VOTES'
  | 'ROUND_REVEAL_OWNER'
  | 'ROUND_INTERMISSION'
  | 'MATCH_OVER';

export interface Player {
  socketId: string;
  userId: string;
  tiktokUsername: string;
  displayName: string;
  avatarId: string;
  avatarBg: string;
  isReady: boolean;
  score: number;
  streak: number;
  correctGuessesCount: number;
  stealthBonusCount: number;
  hasPublicLikes?: boolean;
}

export interface RoundVote {
  voterUserId: string;
  votedForUserId: string;
  timestamp: number;
  reactionTimeMs: number;
}

export interface DeckRound {
  roundNumber: number;
  video: CachedLikedVideo;
  ownerUserId: string;
  ownerDisplayName: string;
  ownerUsername: string;
  isClutch: boolean;
}

export interface RoundResult {
  roundNumber: number;
  video: CachedLikedVideo;
  actualOwnerUserId: string;
  actualOwnerDisplayName: string;
  actualOwnerUsername: string;
  votes: Record<string, string>; // voterUserId -> votedForUserId
  pointsGained: Record<string, number>; // userId -> points earned this round
  stealthAwarded: boolean;
  isClutch: boolean;
  correctGuessesCount: number;
}

export class GameRoom {
  public id: string;
  public status: RoomStatus = 'LOBBY';
  public players: Map<string, Player> = new Map(); // key: userId
  public currentRound = 0;
  public totalRounds = 20;
  public deck: DeckRound[] = [];
  public currentVotes: Map<string, RoundVote> = new Map(); // key: voterUserId
  public roundStartTime = 0;
  public roundDurationMs = 18000; // 18 sekund na głosowanie
  public timer: NodeJS.Timeout | null = null;
  public lastRoundResult: RoundResult | null = null;
  public countdownSeconds = 3;

  constructor(id: string) {
    this.id = id;
  }

  public getPlayerList(): Player[] {
    return Array.from(this.players.values());
  }

  public getPlayerBySocket(socketId: string): Player | undefined {
    return Array.from(this.players.values()).find((p) => p.socketId === socketId);
  }
}

export class GameManager {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomId

  constructor(io: Server) {
    this.io = io;
  }

  public findOrCreateRoom(): GameRoom {
    // Znajdź istniejący pokój w stanie LOBBY z mniej niż 4 graczami
    for (const room of this.rooms.values()) {
      if (room.status === 'LOBBY' && room.players.size < 4) {
        return room;
      }
    }

    // Utwórz nowy pokój
    const roomId = 'room_' + Math.random().toString(36).substring(2, 8);
    const room = new GameRoom(roomId);
    this.rooms.set(roomId, room);
    console.log(`[GameManager] Utworzono nowy pokój: ${roomId}`);
    return room;
  }

  public handlePlayerJoin(
    socket: Socket,
    userData: {
      userId: string;
      tiktokUsername: string;
      displayName: string;
      avatarId: string;
      avatarBg: string;
    }
  ) {
    // Rozłącz z poprzedniego pokoju jeśli istniał
    this.handlePlayerLeave(socket.id);

    const room = this.findOrCreateRoom();
    socket.join(room.id);
    this.socketToRoom.set(socket.id, room.id);

    const player: Player = {
      socketId: socket.id,
      userId: userData.userId,
      tiktokUsername: userData.tiktokUsername.toLowerCase().replace(/^@/, ''),
      displayName: userData.displayName || userData.tiktokUsername,
      avatarId: userData.avatarId || 'pawn_emerald',
      avatarBg: userData.avatarBg || '#10b981',
      isReady: false,
      score: 0,
      streak: 0,
      correctGuessesCount: 0,
      stealthBonusCount: 0,
      hasPublicLikes: true,
    };

    room.players.set(player.userId, player);
    console.log(`[GameManager] Gracz ${player.displayName} (@${player.tiktokUsername}) dołączył do ${room.id} (${room.players.size}/4)`);

    this.broadcastRoomState(room);

    // Sprawdź w tle czy gracz ma publiczne polubienia na TikToku i zaktualizuj stan lobby
    TikTokService.fetchLikedVideos(player.tiktokUsername).then((vids) => {
      const p = room.players.get(player.userId);
      if (p) {
        p.hasPublicLikes = (vids && vids.length > 0);
        this.broadcastRoomState(room);
      }
    }).catch(() => {});

    // Jeśli dołączył 4. gracz, zacznij automatyczne odliczanie 3s
    if (room.players.size === 4 && room.status === 'LOBBY') {
      this.startCountdown(room);
    }
  }

  public handleToggleReady(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return;

    const player = room.getPlayerBySocket(socketId);
    if (!player) return;

    player.isReady = !player.isReady;
    console.log(`[GameManager] Gracz ${player.displayName} zmienił gotowość na: ${player.isReady}`);
    this.broadcastRoomState(room);

    // Sprawdź warunek startu przy 3 graczach
    if (room.players.size >= 3) {
      const allReady = Array.from(room.players.values()).every((p) => p.isReady);
      if (allReady) {
        this.startCountdown(room);
      }
    }
  }

  public handleUpdateProfile(
    socketId: string,
    updates: { displayName?: string; avatarId?: string; avatarBg?: string }
  ) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.getPlayerBySocket(socketId);
    if (!player) return;

    if (updates.displayName) player.displayName = updates.displayName.trim();
    if (updates.avatarId) player.avatarId = updates.avatarId;
    if (updates.avatarBg) player.avatarBg = updates.avatarBg;

    this.broadcastRoomState(room);
  }

  private startCountdown(room: GameRoom) {
    if (room.status === 'STARTING_COUNTDOWN') return;
    room.status = 'STARTING_COUNTDOWN';
    room.countdownSeconds = 3;

    console.log(`[GameManager] Start odliczania w ${room.id}`);
    this.broadcastRoomState(room);

    const interval = setInterval(async () => {
      room.countdownSeconds--;
      if (room.countdownSeconds > 0) {
        this.io.to(room.id).emit('countdown_tick', { seconds: room.countdownSeconds });
      } else {
        clearInterval(interval);
        await this.prepareGame(room);
      }
    }, 1000);
  }

  private async prepareGame(room: GameRoom) {
    console.log(`[GameManager] Przygotowanie talii 20 rund dla pokoju ${room.id}...`);
    this.io.to(room.id).emit('loading_deck', { message: 'Pobieranie polubionych filmów z TikToka...' });

    const playersMap = new Map<
      string,
      { userId: string; username: string; displayName: string; videos: CachedLikedVideo[] }
    >();

    // Pobierz polubione filmy dla każdego gracza
    for (const player of room.players.values()) {
      const videos = await TikTokService.fetchLikedVideos(player.tiktokUsername);
      // BEZWZGLĘDNA ZASADA: Tylko prawdziwe filmy tego gracza!
      // Żadnego fałszywego przypisywania filmów z innego konta!
      const realVideos = (videos || []).filter(
        (v) => v.tiktokUsername.toLowerCase() === player.tiktokUsername.toLowerCase()
      );

      console.log(`[GameManager] Gracz ${player.displayName} (@${player.tiktokUsername}): ${realVideos.length} filmów.`);

      playersMap.set(player.userId, {
        userId: player.userId,
        username: player.tiktokUsername,
        displayName: player.displayName,
        videos: realVideos,
      });
    }

    room.deck = TikTokService.buildMatchDeck(playersMap, room.totalRounds);
    console.log(`[GameManager] Zbudowano talię ${room.deck.length} rund dla pokoju ${room.id}`);

    if (room.deck.length === 0) {
      this.io.to(room.id).emit('error_message', {
        message:
          'Brak filmów do gry! Upewnij się, że gracze mają włączone publiczne polubienia na TikToku (Profil -> Ustawienia -> Prywatność -> Polubione filmy -> Wszyscy).',
      });
      room.status = 'LOBBY';
      this.broadcastRoomState(room);
      return;
    }

    room.currentRound = 0;
    this.startNextRound(room);
  }

  private startNextRound(room: GameRoom) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    room.currentRound++;
    if (room.currentRound > room.deck.length) {
      this.endGame(room);
      return;
    }

    const roundData = room.deck[room.currentRound - 1];
    room.status = 'ROUND_VOTING';
    room.currentVotes.clear();
    room.roundStartTime = Date.now();

    console.log(
      `[GameManager] Runda ${room.currentRound}/${room.deck.length} w ${room.id}: Właściciel ${roundData.ownerDisplayName} (@${roundData.ownerUsername})`
    );

    // Wyślij dane rundy do graczy (w tym prefetch kolejnej rundy!)
    const nextRound = room.deck[room.currentRound] || null;

    room.players.forEach((player) => {
      const isOwner = player.userId === roundData.ownerUserId;
      const targetSocket = this.io.sockets.sockets.get(player.socketId);
      if (targetSocket) {
        targetSocket.emit('round_started', {
          roundNumber: room.currentRound,
          totalRounds: room.deck.length,
          video: {
            videoId: roundData.video.videoId,
            streamUrl: `/api/stream?url=${encodeURIComponent(roundData.video.streamUrl)}`,
            coverUrl: roundData.video.coverUrl,
            authorNickname: roundData.video.authorNickname,
            description: roundData.video.description,
            duration: roundData.video.duration,
          },
          nextVideoUrl: nextRound
            ? `/api/stream?url=${encodeURIComponent(nextRound.video.streamUrl)}`
            : null,
          isOwner,
          isClutch: roundData.isClutch,
          durationMs: room.roundDurationMs,
          deadline: room.roundStartTime + room.roundDurationMs,
          candidates: Array.from(room.players.values()).map((p) => ({
            userId: p.userId,
            displayName: p.displayName,
            avatarId: p.avatarId,
            avatarBg: p.avatarBg,
          })),
        });
      }
    });

    // Ustaw serwerowy timeout rundy
    room.timer = setTimeout(() => {
      this.proceedToReveal(room);
    }, room.roundDurationMs);
  }

  public handleCastVote(socketId: string, votedForUserId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ROUND_VOTING') return;

    const voter = room.getPlayerBySocket(socketId);
    if (!voter) return;

    const currentRound = room.deck[room.currentRound - 1];
    const isOwner = voter.userId === currentRound.ownerUserId;

    // OSOBA, KTÓREJ TO FILM, NIE MOŻE GŁOSOWAĆ!
    if (isOwner) {
      console.warn(`[GameManager] Odrzucono próbę głosu właściciela ${voter.displayName}`);
      return;
    }

    // Jeśli gracz już oddał głos, nie przyjmuj powtórki
    if (room.currentVotes.has(voter.userId)) {
      return;
    }

    const now = Date.now();
    const reactionTime = now - room.roundStartTime;

    room.currentVotes.set(voter.userId, {
      voterUserId: voter.userId,
      votedForUserId,
      timestamp: now,
      reactionTimeMs: reactionTime,
    });

    // Poinformuj klienta o zaakceptowaniu głosu
    const sock = this.io.sockets.sockets.get(socketId);
    if (sock) {
      sock.emit('vote_acknowledged', { votedForUserId, isOwner: false });
    }

    // Uprawnieni do głosowania to wszyscy gracze w pokoju poza właścicielem
    const totalEligible = Math.max(1, room.players.size - 1);

    // Poinformuj pokój o liczbie oddanych głosów
    this.io.to(room.id).emit('vote_progress', {
      votedCount: room.currentVotes.size,
      totalEligible,
    });

    // Jeżeli wszyscy uprawnieni gracze oddali głosy, natychmiast przejdź do odsłonięcia
    if (room.currentVotes.size >= totalEligible) {
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      this.proceedToReveal(room);
    }
  }

  private proceedToReveal(room: GameRoom) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    const currentRound = room.deck[room.currentRound - 1];
    const actualOwnerId = currentRound.ownerUserId;
    const isClutch = currentRound.isClutch;
    const clutchMultiplier = isClutch ? 2.0 : 1.0;

    const votesMap: Record<string, string> = {};
    const pointsGained: Record<string, number> = {};
    let correctGuessCount = 0;

    // Inicjalizuj zyski punktowe na 0
    room.players.forEach((p) => {
      pointsGained[p.userId] = 0;
    });

    // 1. Sprawdź głosy pozostałych graczy (nie-właścicieli)
    room.players.forEach((player) => {
      if (player.userId === actualOwnerId) {
        return; // Właściciel nie głosuje na siebie
      }

      const vote = room.currentVotes.get(player.userId);
      if (vote) {
        votesMap[player.userId] = vote.votedForUserId;

        if (vote.votedForUserId === actualOwnerId) {
          // Prawidłowe odgadnięcie!
          correctGuessCount++;
          player.correctGuessesCount++;
          player.streak++;

          // Punkty bazowe (+200 pkt)
          let basePoints = 200;

          // Bonus za szybkość reakcji (+50 do +200 pkt)
          const timeFrac = Math.min(1, Math.max(0, vote.reactionTimeMs / room.roundDurationMs));
          const speedBonus = Math.round(200 * (1 - timeFrac));

          // Mnożnik serii
          let streakMultiplier = 1.0;
          if (player.streak === 2) streakMultiplier = 1.2;
          else if (player.streak === 3) streakMultiplier = 1.5;
          else if (player.streak === 4) streakMultiplier = 1.8;
          else if (player.streak >= 5) streakMultiplier = Math.min(3.0, 2.0 + (player.streak - 5) * 0.2);

          const roundTotal = Math.round(
            (basePoints + speedBonus) * streakMultiplier * clutchMultiplier
          );

          pointsGained[player.userId] = roundTotal;
          player.score += roundTotal;
        } else {
          // Błędny głos -> reset serii
          player.streak = 0;
        }
      } else {
        // Brak głosu -> reset serii
        player.streak = 0;
      }
    });

    // 2. Bonus Kamuflażu (Stealth Bonus) dla właściciela
    // WŁAŚCICIEL DOSTAJE PUNKTY TYLKO WTEDY, GDY NIKT GO NIE ZGADŁ!
    let stealthAwarded = false;
    const ownerPlayer = room.players.get(actualOwnerId);

    if (ownerPlayer) {
      if (correctGuessCount === 0) {
        stealthAwarded = true;
        ownerPlayer.stealthBonusCount++;
        const stealthBase = 300;
        const stealthPoints = Math.round(stealthBase * clutchMultiplier);
        pointsGained[actualOwnerId] = stealthPoints;
        ownerPlayer.score += stealthPoints;
        console.log(`[GameManager] Właściciel ${ownerPlayer.displayName} zdobył bonus za kamuflaż: +${stealthPoints} pkt! Nikt go nie odgadł.`);
      } else {
        pointsGained[actualOwnerId] = 0;
        console.log(`[GameManager] Właściciel ${ownerPlayer.displayName} odgadnięty przez ${correctGuessCount} graczy. 0 pkt.`);
      }
    }

    room.lastRoundResult = {
      roundNumber: room.currentRound,
      video: currentRound.video,
      actualOwnerUserId: actualOwnerId,
      actualOwnerDisplayName: currentRound.ownerDisplayName,
      actualOwnerUsername: currentRound.ownerUsername,
      votes: votesMap,
      pointsGained,
      stealthAwarded,
      isClutch,
      correctGuessesCount: correctGuessCount,
    };

    // NATYCHMIASTOWE ODSŁONIĘCIE: Prawdziwy właściciel, głosy i punkty bez żadnego ukrywania!
    room.status = 'ROUND_REVEAL_OWNER';
    this.io.to(room.id).emit('reveal_owner_phase', {
      result: room.lastRoundResult,
      standings: this.getStandings(room),
      correctGuessesCount: correctGuessCount,
    });

    room.timer = setTimeout(() => {
      // Faza 3: Intermisja i tablica wyników (3 sekundy)
      room.status = 'ROUND_INTERMISSION';
      this.io.to(room.id).emit('round_intermission', {
        roundNumber: room.currentRound,
        standings: this.getStandings(room),
        nextRoundIn: 3,
      });

      room.timer = setTimeout(() => {
        this.startNextRound(room);
      }, 3000);
    }, 4500);
  }

  private endGame(room: GameRoom) {
    room.status = 'MATCH_OVER';
    if (room.timer) clearTimeout(room.timer);

    const standings = this.getStandings(room);
    const winner = standings[0];

    console.log(`[GameManager] Koniec gry w ${room.id}! Zwycięzca: ${winner?.displayName} (${winner?.score} pkt)`);

    // Zapisz wyniki meczu w bazie danych
    room.players.forEach((p) => {
      const isWinner = winner && winner.userId === p.userId;
      db.recordGameResult(p.userId, p.score, isWinner, p.correctGuessesCount, p.streak);
    });

    this.io.to(room.id).emit('game_over', {
      standings,
      winner,
      totalRounds: room.totalRounds,
    });
  }

  public getStandings(room: GameRoom): {
    userId: string;
    displayName: string;
    avatarId: string;
    avatarBg: string;
    score: number;
    streak: number;
    correctGuesses: number;
    stealthBonuses: number;
  }[] {
    return Array.from(room.players.values())
      .map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        avatarId: p.avatarId,
        avatarBg: p.avatarBg,
        score: p.score,
        streak: p.streak,
        correctGuesses: p.correctGuessesCount,
        stealthBonuses: p.stealthBonusCount,
      }))
      .sort((a, b) => b.score - a.score);
  }

  public broadcastRoomState(room: GameRoom) {
    this.io.to(room.id).emit('room_state_update', {
      roomId: room.id,
      status: room.status,
      players: room.getPlayerList(),
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      countdownSeconds: room.countdownSeconds,
    });
  }

  public handlePlayerLeave(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.getPlayerBySocket(socketId);
    if (player) {
      room.players.delete(player.userId);
      console.log(`[GameManager] Gracz ${player.displayName} opuścił ${room.id} (pozostało ${room.players.size})`);

      if (room.players.size === 0) {
        if (room.timer) clearTimeout(room.timer);
        this.rooms.delete(room.id);
        console.log(`[GameManager] Zamknięto pusty pokój ${room.id}`);
      } else {
        this.broadcastRoomState(room);
      }
    }
  }
}
