import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  tiktokUsername: string;
  secUid?: string;
  displayName: string;
  avatarId: string;
  avatarBg: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  correctGuesses: number;
  bestStreak: number;
  updatedAt: string;
}

export interface CachedLikedVideo {
  videoId: string;
  tiktokUsername: string;
  streamUrl: string;
  coverUrl: string;
  authorNickname: string;
  description: string;
  duration: number;
  isRecent: boolean;
  cachedAt: number;
}

interface DatabaseSchema {
  users: Record<string, User>; // key: userId
  usersByUsername: Record<string, string>; // key: lowercase username -> userId
  stats: Record<string, UserStats>; // key: userId
  likedVideosCache: Record<string, CachedLikedVideo[]>; // key: lowercase username
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'pionkiii_db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: {},
    usersByUsername: {},
    stats: {},
    likedVideosCache: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Błąd inicjalizacji bazy danych:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Błąd zapisu bazy danych:', err);
    }
  }

  public getUserByTikTok(username: string): User | null {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const userId = this.data.usersByUsername[cleanUsername];
    if (!userId) return null;
    return this.data.users[userId] || null;
  }

  public getUserById(id: string): User | null {
    return this.data.users[id] || null;
  }

  public upsertUser(input: {
    id: string;
    tiktokUsername: string;
    secUid?: string;
    displayName?: string;
    avatarId?: string;
    avatarBg?: string;
  }): { user: User; stats: UserStats } {
    const cleanUsername = input.tiktokUsername.trim().toLowerCase().replace(/^@/, '');
    const now = new Date().toISOString();

    let user = this.getUserByTikTok(cleanUsername) || this.getUserById(input.id);

    if (user) {
      user.tiktokUsername = cleanUsername;
      if (input.secUid) user.secUid = input.secUid;
      if (input.displayName) user.displayName = input.displayName.trim();
      if (input.avatarId) user.avatarId = input.avatarId;
      if (input.avatarBg) user.avatarBg = input.avatarBg;
      user.updatedAt = now;
      this.data.users[user.id] = user;
      this.data.usersByUsername[cleanUsername] = user.id;
    } else {
      user = {
        id: input.id,
        tiktokUsername: cleanUsername,
        secUid: input.secUid,
        displayName: input.displayName?.trim() || cleanUsername,
        avatarId: input.avatarId || 'pawn_emerald',
        avatarBg: input.avatarBg || '#10b981',
        createdAt: now,
        updatedAt: now,
      };
      this.data.users[user.id] = user;
      this.data.usersByUsername[cleanUsername] = user.id;
    }

    // Ensure stats exist
    let stats = this.data.stats[user.id];
    if (!stats) {
      stats = {
        userId: user.id,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPoints: 0,
        correctGuesses: 0,
        bestStreak: 0,
        updatedAt: now,
      };
      this.data.stats[user.id] = stats;
    }

    this.save();
    return { user, stats };
  }

  public getUserStats(userId: string): UserStats {
    if (!this.data.stats[userId]) {
      this.data.stats[userId] = {
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPoints: 0,
        correctGuesses: 0,
        bestStreak: 0,
        updatedAt: new Date().toISOString(),
      };
      this.save();
    }
    return this.data.stats[userId];
  }

  public recordGameResult(
    userId: string,
    points: number,
    isWinner: boolean,
    correctGuesses: number,
    streak: number
  ): UserStats {
    const stats = this.getUserStats(userId);
    stats.gamesPlayed += 1;
    if (isWinner) stats.gamesWon += 1;
    stats.totalPoints += points;
    stats.correctGuesses += correctGuesses;
    if (streak > stats.bestStreak) {
      stats.bestStreak = streak;
    }
    stats.updatedAt = new Date().toISOString();
    this.save();
    return stats;
  }

  public saveLikedVideos(tiktokUsername: string, videos: CachedLikedVideo[]) {
    const cleanUsername = tiktokUsername.trim().toLowerCase().replace(/^@/, '');
    this.data.likedVideosCache[cleanUsername] = videos;
    this.save();
  }

  public getCachedLikedVideos(tiktokUsername: string): CachedLikedVideo[] | null {
    const cleanUsername = tiktokUsername.trim().toLowerCase().replace(/^@/, '');
    const cache = this.data.likedVideosCache[cleanUsername];
    if (!cache || cache.length === 0) return null;
    // Cache valid for 3 hours
    const oldest = cache[0]?.cachedAt || 0;
    if (Date.now() - oldest > 1000 * 60 * 60 * 3) {
      return null;
    }
    return cache;
  }
}

export const db = new DatabaseService();
