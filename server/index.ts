import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './db.js';
import { TikTokService } from './tiktok.js';
import { handleStreamProxy } from './streamProxy.js';
import { GameManager } from './gameManager.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serwuj statyczny build frontendu jeśli istnieje (folder dist)
import path from 'path';
import fs from 'fs';
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// GameManager
const gameManager = new GameManager(io);

// === REST API ENDPOINTS ===

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Pionkiii Server', time: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Proxy strumieniowania wideo dla ominięcia ograniczeń CORS i Referer TikToka
app.get('/api/stream', handleStreamProxy);

// Synchronizacja profilu użytkownika
app.post('/api/user/sync', async (req, res) => {
  try {
    const { id, tiktokUsername, displayName, avatarId, avatarBg } = req.body;
    if (!tiktokUsername) {
      res.status(400).json({ error: 'Brak nazwy TikTok (@username)' });
      return;
    }

    // Opcjonalnie pobierz secUid z profilu TikToka w tle
    let secUid: string | undefined;
    try {
      const info = await TikTokService.resolveUser(tiktokUsername);
      if (info?.secUid) secUid = info.secUid;
    } catch (e) {
      // Ignoruj błąd przy pobieraniu secUid
    }

    const result = db.upsertUser({
      id: id || 'usr_' + Math.random().toString(36).substring(2, 10),
      tiktokUsername,
      secUid,
      displayName,
      avatarId,
      avatarBg,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API] Błąd synchronizacji użytkownika:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobieranie statystyk
app.get('/api/user/stats/:userId', (req, res) => {
  try {
    const stats = db.getUserStats(req.params.userId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Test pobierania filmów z konta TikToka
app.get('/api/tiktok/test/:username', async (req, res) => {
  const username = req.params.username;
  try {
    console.log(`[API Test] Testowanie pobierania ulubionych dla @${username}...`);
    const videos = await TikTokService.fetchLikedVideos(username, undefined, 40);
    res.json({
      success: true,
      username,
      count: videos.length,
      sample: videos.slice(0, 3).map((v) => ({
        id: v.videoId,
        author: v.authorNickname,
        desc: v.description,
        streamProxyUrl: `/api/stream?url=${encodeURIComponent(v.streamUrl)}`,
        cover: v.coverUrl,
        duration: v.duration,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Błąd pobierania' });
  }
});

// Fallback importu pliku JSON eksportu danych
app.post('/api/tiktok/import-json', (req, res) => {
  const { username, jsonContent } = req.body;
  if (!username || !jsonContent) {
    res.status(400).json({ error: 'Wymagana nazwa użytkownika i treść JSON' });
    return;
  }
  const parsed = TikTokService.parseUserDataJson(jsonContent, username);
  if (parsed.length > 0) {
    db.saveLikedVideos(username, parsed);
    res.json({ success: true, count: parsed.length });
  } else {
    res.status(400).json({ error: 'Nie znaleziono filmów w przekazanym pliku JSON' });
  }
});

// === REALTIME SOCKET.IO EVENT HANDLERS ===

io.on('connection', (socket) => {
  console.log(`[Socket] Nowe połączenie: ${socket.id}`);

  socket.on('join_game', (userData) => {
    gameManager.handlePlayerJoin(socket, userData);
  });

  socket.on('toggle_ready', () => {
    gameManager.handleToggleReady(socket.id);
  });

  socket.on('update_profile', (updates) => {
    gameManager.handleUpdateProfile(socket.id, updates);
  });

  socket.on('cast_vote', ({ votedForUserId }) => {
    gameManager.handleCastVote(socket.id, votedForUserId);
  });

  socket.on('leave_game', () => {
    gameManager.handlePlayerLeave(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Rozłączono: ${socket.id}`);
    gameManager.handlePlayerLeave(socket.id);
  });
});

// SPA Fallback dla wszystkich pozostałych tras GET
app.get('*', (req, res) => {
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Pionkiii Server API działa. Zbuduj frontend za pomocą npm run build.');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`♟️ [Pionkiii Serwer] Działa na porcie ${PORT}`);
  console.log(`🔗 API i WebSocket gotowe na http://localhost:${PORT}`);
});
