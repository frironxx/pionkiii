import { UserProfile, UserStats } from '../types';

const STORAGE_KEY_USER = 'pionkiii_user_profile';
const STORAGE_KEY_STATS = 'pionkiii_user_stats';

export const storage = {
  getUserProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Błąd odczytu profilu z localStorage:', e);
    }

    // Domyślny profil
    const defaultProfile: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      tiktokUsername: 'friron411k',
      displayName: 'Friron',
      avatarId: 'pawn_emerald',
      avatarBg: '#10b981',
    };

    this.saveUserProfile(defaultProfile);
    return defaultProfile;
  },

  saveUserProfile(profile: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch (e) {
      console.error('Błąd zapisu profilu do localStorage:', e);
    }
  },

  getUserStats(): UserStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Błąd odczytu statystyk z localStorage:', e);
    }

    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalPoints: 0,
      correctGuesses: 0,
      bestStreak: 0,
    };
  },

  saveUserStats(stats: UserStats) {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Błąd zapisu statystyk do localStorage:', e);
    }
  },

  async syncWithServer(profile: UserProfile): Promise<{ profile: UserProfile; stats: UserStats }> {
    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        const syncedProfile = {
          ...profile,
          displayName: data.user.displayName,
          avatarId: data.user.avatarId,
          avatarBg: data.user.avatarBg,
        };
        const syncedStats = {
          gamesPlayed: data.stats.gamesPlayed,
          gamesWon: data.stats.gamesWon,
          totalPoints: data.stats.totalPoints,
          correctGuesses: data.stats.correctGuesses,
          bestStreak: data.stats.bestStreak,
        };

        this.saveUserProfile(syncedProfile);
        this.saveUserStats(syncedStats);

        return { profile: syncedProfile, stats: syncedStats };
      }
    } catch (e) {
      console.warn('[Sync] Brak połączenia z serwerem, użycie danych offline:', e);
    }
    return { profile, stats: this.getUserStats() };
  },
};
