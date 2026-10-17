export interface UserProfile {
  id: string;
  tiktokUsername: string;
  displayName: string;
  avatarId: string;
  avatarBg: string;
}

export const isCustomAvatar = (avatarId?: string): boolean => {
  if (!avatarId) return false;
  return (
    avatarId.startsWith('/api/avatar') ||
    avatarId.startsWith('data:image') ||
    avatarId.startsWith('http://') ||
    avatarId.startsWith('https://')
  );
};

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  correctGuesses: number;
  bestStreak: number;
}

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
}

export type RoomStatus =
  | 'MENU'
  | 'LOBBY'
  | 'STARTING_COUNTDOWN'
  | 'ROUND_VOTING'
  | 'ROUND_REVEAL_VOTES'
  | 'ROUND_REVEAL_OWNER'
  | 'ROUND_INTERMISSION'
  | 'MATCH_OVER';

export interface RoundVideo {
  videoId: string;
  streamUrl: string;
  coverUrl: string;
  authorNickname: string;
  description: string;
  duration: number;
}

export interface RoundStartPayload {
  roundNumber: number;
  totalRounds: number;
  video: RoundVideo;
  nextVideoUrl: string | null;
  isOwner: boolean;
  isClutch: boolean;
  durationMs: number;
  deadline: number;
  candidates: {
    userId: string;
    displayName: string;
    avatarId: string;
    avatarBg: string;
  }[];
}

export interface RoundResult {
  roundNumber: number;
  video: RoundVideo;
  actualOwnerUserId: string;
  actualOwnerDisplayName: string;
  votes: Record<string, string>; // voterUserId -> votedForUserId
  pointsGained: Record<string, number>;
  stealthAwarded: boolean;
  isClutch: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarId: string;
  avatarBg: string;
  score: number;
  streak: number;
  correctGuesses: number;
  stealthBonuses: number;
}
