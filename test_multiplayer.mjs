import { io } from 'socket.io-client';

async function simulateGame() {
  console.log('--- Rozpoczęcie symulacji gry 3 graczy ---');

  const p1 = io('http://localhost:3001');
  const p2 = io('http://localhost:3001');
  const p3 = io('http://localhost:3001');

  await new Promise((res) => setTimeout(res, 500));

  p1.emit('join_game', {
    userId: 'usr_p1',
    tiktokUsername: 'friron411k',
    displayName: 'Friron',
    avatarId: 'pawn_classic',
    avatarBg: '#10b981',
  });

  p2.emit('join_game', {
    userId: 'usr_p2',
    tiktokUsername: 'friron411k',
    displayName: 'Ania',
    avatarId: 'crown_gold',
    avatarBg: '#f59e0b',
  });

  p3.emit('join_game', {
    userId: 'usr_p3',
    tiktokUsername: 'friron411k',
    displayName: 'Marek',
    avatarId: 'knight_tactics',
    avatarBg: '#8b5cf6',
  });

  await new Promise((res) => setTimeout(res, 500));

  console.log('Wszyscy trzej gracze klikają GOTOWY...');
  p1.emit('toggle_ready');
  p2.emit('toggle_ready');
  p3.emit('toggle_ready');

  p1.on('room_state_update', (st) => {
    console.log(`[P1 Stan] Status: ${st.status}, Graczy: ${st.players.length}`);
  });

  p1.on('countdown_tick', (t) => {
    console.log(`[Odliczanie] ${t.seconds}s`);
  });

  p1.on('loading_deck', (d) => {
    console.log(`[Talia] ${d.message}`);
  });

  p1.on('round_started', (r) => {
    console.log(
      `[START RUNDY] Runda ${r.roundNumber}/${r.totalRounds}, Wideo: ${r.video.authorNickname}, Czy właściciel: ${r.isOwner}`
    );

    // Wykonaj głosowanie
    setTimeout(() => {
      console.log('Gracze oddają głosy...');
      p1.emit('cast_vote', { votedForUserId: 'usr_p2' });
      p2.emit('cast_vote', { votedForUserId: 'usr_p1' });
      p3.emit('cast_vote', { votedForUserId: 'usr_p1' });
    }, 500);
  });

  p1.on('reveal_votes_phase', (v) => {
    console.log('[ODSŁONIĘCIE GŁOSÓW]', v.votes);
  });

  p1.on('reveal_owner_phase', (res) => {
    console.log(
      `[ODSŁONIĘCIE WŁAŚCICIELA] Prawdziwy właściciel: ${res.result.actualOwnerDisplayName}, Punkty:`,
      res.result.pointsGained
    );
    console.log('Symulacja zakończona sukcesem!');
    setTimeout(() => {
      p1.disconnect();
      p2.disconnect();
      p3.disconnect();
      process.exit(0);
    }, 1000);
  });
}

simulateGame().catch((e) => {
  console.error('Błąd symulacji:', e);
  process.exit(1);
});
