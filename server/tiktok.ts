import axios from 'axios';
import { db, CachedLikedVideo } from './db.js';

interface TikTokUserInfo {
  uniqueId: string;
  secUid: string;
  nickname: string;
  avatarUrl: string;
  diggCount: number;
  isPrivate: boolean;
  openFavorite: boolean;
}

export class TikTokService {
  private static userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

  /**
   * Pobiera metadane profilu TikToka z HTML i nagłówków
   */
  public static async resolveUser(username: string): Promise<TikTokUserInfo | null> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const url = `https://www.tiktok.com/@${cleanUsername}`;

    try {
      console.log(`[TikTok] Rozwiązywanie profilu @${cleanUsername}...`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      });

      const html = response.data as string;
      const jsonMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/
      );

      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        const defaultScope = parsed['__DEFAULT_SCOPE__'] || {};
        const userDetail = defaultScope['webapp.user-detail'] || {};
        const userInfo = userDetail['userInfo'] || {};
        const user = userInfo['user'] || {};
        const stats = userInfo['stats'] || {};

        if (user.secUid) {
          return {
            uniqueId: cleanUsername,
            secUid: user.secUid,
            nickname: user.nickname || cleanUsername,
            avatarUrl: user.avatarLarger || user.avatarMedium || user.avatarThumb || '',
            diggCount: stats.diggCount || 0,
            isPrivate: !!user.privateAccount,
            openFavorite: user.openFavorite !== false,
          };
        }
      }

      console.warn(`[TikTok] Brak danych rehydratacji dla @${cleanUsername}`);
      return null;
    } catch (err: any) {
      console.error(`[TikTok] Błąd pobierania profilu @${cleanUsername}:`, err?.message || err);
      return null;
    }
  }

  /**
   * Pobiera polubione filmy (w tym najnowsze i starsze deep cuts)
   */
  public static async fetchLikedVideos(
    username: string,
    secUid?: string,
    limit = 50
  ): Promise<CachedLikedVideo[]> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    // Sprawdź najpierw pamięć podręczną w bazie
    const cached = db.getCachedLikedVideos(cleanUsername);
    if (cached && cached.length >= 10) {
      console.log(`[TikTok] Użycie zbuforowanych filmów dla @${cleanUsername} (${cached.length} filmów)`);
      return cached;
    }

    let actualSecUid = secUid;
    if (!actualSecUid) {
      const user = await this.resolveUser(cleanUsername);
      if (!user?.secUid) {
        console.warn(`[TikTok] Nie udało się uzyskać secUid dla @${cleanUsername}`);
        return [];
      }
      actualSecUid = user.secUid;
    }

    const allVideos: CachedLikedVideo[] = [];
    let cursor = 0;
    let hasMore = true;
    let pagesFetched = 0;
    const maxPages = Math.ceil(limit / 30);

    while (hasMore && pagesFetched < maxPages) {
      try {
        const apiUrl = `https://www.tiktok.com/api/favorite/item_list/?aid=1988&count=30&cursor=${cursor}&secUid=${actualSecUid}`;
        console.log(`[TikTok] Zapytanie do API favorite (kursor ${cursor}, strona ${pagesFetched + 1})...`);

        const res = await axios.get(apiUrl, {
          headers: {
            'User-Agent': this.userAgent,
            Referer: `https://www.tiktok.com/@${cleanUsername}`,
            Accept: 'application/json, text/plain, */*',
          },
          timeout: 10000,
        });

        const data = res.data;
        if (data.statusCode !== 0 || !Array.isArray(data.itemList)) {
          console.warn(`[TikTok] Odpowiedź API favorite: statusCode ${data.statusCode}`);
          break;
        }

        const items = data.itemList;
        const now = Date.now();

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const vid = item.video || {};
          const playUrl = vid.playAddr || vid.downloadAddr || '';
          if (!playUrl) continue;

          allVideos.push({
            videoId: item.id || `tik_${now}_${i}`,
            tiktokUsername: cleanUsername,
            streamUrl: playUrl,
            coverUrl: vid.cover || vid.dynamicCover || '',
            authorNickname: item.author?.nickname || 'TikTok Twórca',
            description: item.desc || '',
            duration: vid.duration || 15,
            isRecent: allVideos.length < 15, // Pierwsze 15 to najnowsze
            cachedAt: now,
          });
        }

        hasMore = data.hasMore && items.length > 0;
        cursor = data.cursor || 0;
        pagesFetched++;
      } catch (err: any) {
        console.error(`[TikTok] Błąd pobierania ulubionych na kursorze ${cursor}:`, err?.message || err);
        break;
      }
    }

    if (allVideos.length > 0) {
      db.saveLikedVideos(cleanUsername, allVideos);
      console.log(`[TikTok] Zapisano ${allVideos.length} polubionych filmów dla @${cleanUsername}`);
    }

    return allVideos;
  }

  /**
   * Buduje talię 20 rund wg algorytmu 80/20 z puli połączonych graczy
   */
  public static buildMatchDeck(
    playersMap: Map<string, { userId: string; username: string; displayName: string; videos: CachedLikedVideo[] }>,
    targetRounds = 20
  ): {
    roundNumber: number;
    video: CachedLikedVideo;
    ownerUserId: string;
    ownerDisplayName: string;
    ownerUsername: string;
    isClutch: boolean; // Rundy 16-20
  }[] {
    const players = Array.from(playersMap.values()).filter((p) => p.videos.length > 0);
    if (players.length === 0) return [];

    const deck: {
      roundNumber: number;
      video: CachedLikedVideo;
      ownerUserId: string;
      ownerDisplayName: string;
      ownerUsername: string;
      isClutch: boolean;
    }[] = [];

    // Oblicz liczbę filmów na gracza
    const basePerPlayer = Math.floor(targetRounds / players.length);
    let remainder = targetRounds % players.length;

    const selectedPool: {
      video: CachedLikedVideo;
      ownerUserId: string;
      ownerDisplayName: string;
      ownerUsername: string;
    }[] = [];

    players.forEach((player) => {
      const quota = basePerPlayer + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const vids = [...player.videos];
      // Podział 80/20
      const recentCutoff = Math.max(1, Math.floor(vids.length * 0.25));
      const recentList = vids.slice(0, recentCutoff);
      const olderList = vids.slice(recentCutoff);

      const recentQuota = Math.round(quota * 0.8);
      const olderQuota = quota - recentQuota;

      const pickedRecent = this.pickRandom(recentList, recentQuota);
      const pickedOlder = this.pickRandom(olderList.length > 0 ? olderList : recentList, olderQuota);

      [...pickedRecent, ...pickedOlder].forEach((vid) => {
        selectedPool.push({
          video: vid,
          ownerUserId: player.userId,
          ownerDisplayName: player.displayName,
          ownerUsername: player.username,
        });
      });
    });

    // Wymieszaj talię tak, aby unikać tego samego gracza 2 razy z rzędu
    const shuffled = this.fairShuffle(selectedPool);

    for (let i = 0; i < Math.min(targetRounds, shuffled.length); i++) {
      const item = shuffled[i];
      deck.push({
        roundNumber: i + 1,
        video: item.video,
        ownerUserId: item.ownerUserId,
        ownerDisplayName: item.ownerDisplayName,
        ownerUsername: item.ownerUsername,
        isClutch: i + 1 >= 16, // Rundy 16-20 to Clutch x2
      });
    }

    return deck;
  }

  private static pickRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  private static fairShuffle<T extends { ownerUserId: string }>(items: T[]): T[] {
    const remaining = [...items].sort(() => 0.5 - Math.random());
    const result: T[] = [];

    while (remaining.length > 0) {
      const lastOwner = result.length > 0 ? result[result.length - 1].ownerUserId : null;
      let nextIndex = remaining.findIndex((item) => item.ownerUserId !== lastOwner);
      if (nextIndex === -1) {
        nextIndex = 0; // Nie da się uniknąć, weź pierwszy
      }
      result.push(remaining.splice(nextIndex, 1)[0]);
    }

    return result;
  }

  /**
   * Parser awaryjny dla pliku user_data.json (Eksport danych z TikToka)
   */
  public static parseUserDataJson(jsonContent: string, username: string): CachedLikedVideo[] {
    try {
      const data = JSON.parse(jsonContent);
      const activity = data['Activity'] || data['activity'] || {};
      const likeList =
        activity['Like List']?.['ItemFavoriteList'] ||
        activity['Favorite List'] ||
        activity['favorite_list'] ||
        [];

      const now = Date.now();
      const videos: CachedLikedVideo[] = [];

      for (let i = 0; i < likeList.length; i++) {
        const item = likeList[i];
        const link = item.link || item.VideoLink || item.url || '';
        if (link) {
          videos.push({
            videoId: `export_${i}`,
            tiktokUsername: username,
            streamUrl: link,
            coverUrl: '',
            authorNickname: 'TikTok Twórca',
            description: item.date || 'Polubiony film z archiwum',
            duration: 15,
            isRecent: i < 10,
            cachedAt: now,
          });
        }
      }
      return videos;
    } catch (e) {
      console.error('[TikTok] Błąd parsowania user_data.json:', e);
      return [];
    }
  }
}
