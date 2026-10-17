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

  // Pamięć sesji dla zagranych filmów (zapobiega powtarzaniu tych samych filmów w kolejnych grach)
  private static recentlyPlayedIds = new Set<string>();

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
   * Głębokie pobieranie polubionych filmów (do 150 pozycji na kilku stronach kursora)
   */
  public static async fetchLikedVideos(
    username: string,
    secUid?: string,
    limit = 150
  ): Promise<CachedLikedVideo[]> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    // Sprawdź pamięć podręczną (jeśli ma >= 60 filmów, użyj jej)
    const cached = db.getCachedLikedVideos(cleanUsername);
    if (cached && cached.length >= 60) {
      console.log(`[TikTok] Użycie ${cached.length} zbuforowanych filmów dla @${cleanUsername}`);
      return cached;
    }

    let actualSecUid = secUid;
    if (!actualSecUid) {
      const user = await this.resolveUser(cleanUsername);
      if (!user?.secUid) {
        console.warn(`[TikTok] Nie udało się uzyskać secUid dla @${cleanUsername}`);
        return cached || [];
      }
      actualSecUid = user.secUid;
    }

    const allVideos: CachedLikedVideo[] = [];
    const seenIds = new Set<string>();
    let cursor = 0;
    let hasMore = true;
    let pagesFetched = 0;
    const maxPages = Math.ceil(limit / 25); // ~5-6 stron

    while (hasMore && pagesFetched < maxPages) {
      try {
        const apiUrl = `https://www.tiktok.com/api/favorite/item_list/?aid=1988&count=30&cursor=${cursor}&secUid=${actualSecUid}`;
        console.log(`[TikTok] Głębokie pobieranie (kursor ${cursor}, strona ${pagesFetched + 1}/${maxPages})...`);

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
          console.warn(`[TikTok] Odpowiedź favorite statusCode ${data.statusCode}`);
          break;
        }

        const items = data.itemList;
        const now = Date.now();

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const vid = item.video || {};
          const playUrl = vid.playAddr || vid.downloadAddr || '';
          const vidId = String(item.id || `tik_${now}_${pagesFetched}_${i}`);
          if (!playUrl || seenIds.has(vidId)) continue;

          seenIds.add(vidId);
          allVideos.push({
            videoId: vidId,
            tiktokUsername: cleanUsername,
            streamUrl: playUrl,
            coverUrl: vid.cover || vid.dynamicCover || '',
            authorNickname: item.author?.nickname || 'TikTok Twórca',
            description: item.desc || '',
            duration: vid.duration || 15,
            isRecent: allVideos.length < 30, // Pierwsze 30 to najnowsze
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
      console.log(`[TikTok] Zapisano ${allVideos.length} filmów w puli dla @${cleanUsername}`);
      return allVideos;
    }

    return cached || [];
  }

  /**
   * MĄDRE DOBIERANIE FILMÓW (Inteligentny 80/20 Match Deck):
   * 1. Globalne deduplikowanie: ten sam film NIGDY nie pojawi się 2 razy w jednym meczu!
   * 2. Pamięć sesji: filmy zagrane w poprzednich grach mają najniższy priorytet, więc każda partia przynosi nowe filmy.
   * 3. Podział 80/20: 80% najnowsze hity, 20% zaskakujące starsze deep cuts z archiwum.
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
    isClutch: boolean;
  }[] {
    const players = Array.from(playersMap.values()).filter((p) => p.videos.length > 0);
    if (players.length === 0) return [];

    const globalUsedIds = new Set<string>();
    const selectedPool: {
      video: CachedLikedVideo;
      ownerUserId: string;
      ownerDisplayName: string;
      ownerUsername: string;
    }[] = [];

    const basePerPlayer = Math.floor(targetRounds / players.length);
    let remainder = targetRounds % players.length;

    players.forEach((player) => {
      const quota = basePerPlayer + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      // Dostępne filmy dla tego gracza, których JESZCZE NIE UŻYTO w tej talii
      let available = player.videos.filter((v) => !globalUsedIds.has(v.videoId));
      if (available.length < quota) {
        // W razie małej bazy pozwól na resztę
        available = player.videos;
      }

      // Podziel na filmy jeszcze NIEGRANE w tej sesji oraz wcześniej grane
      const unplayed = available.filter((v) => !this.recentlyPlayedIds.has(v.videoId));
      const poolToUse = unplayed.length >= quota ? unplayed : available;

      // Inteligentny podział 80/20
      // 80% z nowszej strefy (pierwsze 30%), 20% ze starszych perełek (głębokie archiwum 70%)
      const splitIdx = Math.max(3, Math.floor(poolToUse.length * 0.3));
      const recentTier = poolToUse.slice(0, splitIdx);
      const deepCutsTier = poolToUse.slice(splitIdx);

      const recentQuota = Math.max(1, Math.round(quota * 0.8));
      const deepQuota = quota - recentQuota;

      const pickedRecent = this.pickRandomUnique(recentTier, recentQuota, globalUsedIds);
      const pickedDeep = this.pickRandomUnique(
        deepCutsTier.length > 0 ? deepCutsTier : poolToUse,
        deepQuota,
        globalUsedIds
      );

      const combined = [...pickedRecent, ...pickedDeep];

      // Jeśli brakuje do kwoty z powodu deduplikacji, dobierz cokolwiek unikalnego
      if (combined.length < quota) {
        const extra = this.pickRandomUnique(poolToUse, quota - combined.length, globalUsedIds);
        combined.push(...extra);
      }

      combined.forEach((vid) => {
        globalUsedIds.add(vid.videoId);
        this.recentlyPlayedIds.add(vid.videoId);
        selectedPool.push({
          video: vid,
          ownerUserId: player.userId,
          ownerDisplayName: player.displayName,
          ownerUsername: player.username,
        });
      });
    });

    // Czyść pamięć sesji jeśli przekroczy 250 filmów (rotacja)
    if (this.recentlyPlayedIds.size > 250) {
      this.recentlyPlayedIds.clear();
    }

    // Sprawiedliwe wymieszanie: żaden gracz nie ma swojego filmu 2 razy z rzędu
    const shuffled = this.fairShuffle(selectedPool);

    const deck: {
      roundNumber: number;
      video: CachedLikedVideo;
      ownerUserId: string;
      ownerDisplayName: string;
      ownerUsername: string;
      isClutch: boolean;
    }[] = [];

    for (let i = 0; i < Math.min(targetRounds, shuffled.length); i++) {
      const item = shuffled[i];
      deck.push({
        roundNumber: i + 1,
        video: item.video,
        ownerUserId: item.ownerUserId,
        ownerDisplayName: item.ownerDisplayName,
        ownerUsername: item.ownerUsername,
        isClutch: i + 1 >= 16,
      });
    }

    console.log(`[TikTok] Skomponowano talię ${deck.length} unikalnych rund (zero powtórek).`);
    return deck;
  }

  private static pickRandomUnique<T extends { videoId: string }>(
    array: T[],
    count: number,
    usedIds: Set<string>
  ): T[] {
    const candidates = array.filter((item) => !usedIds.has(item.videoId));
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const result: T[] = [];

    for (const item of shuffled) {
      if (result.length >= count) break;
      if (!usedIds.has(item.videoId)) {
        result.push(item);
        usedIds.add(item.videoId);
      }
    }

    return result;
  }

  private static fairShuffle<T extends { ownerUserId: string }>(items: T[]): T[] {
    const remaining = [...items].sort(() => 0.5 - Math.random());
    const result: T[] = [];

    while (remaining.length > 0) {
      const lastOwner = result.length > 0 ? result[result.length - 1].ownerUserId : null;
      let nextIndex = remaining.findIndex((item) => item.ownerUserId !== lastOwner);
      if (nextIndex === -1) {
        nextIndex = 0;
      }
      result.push(remaining.splice(nextIndex, 1)[0]);
    }

    return result;
  }

  /**
   * Parser awaryjny dla pliku user_data.json
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
            isRecent: i < 20,
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
