import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      // Łączenie z bieżącym hostem (Vite proxy przekieruje na backend)
      this.socket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Połączono z serwerem gry Pionkiii:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Rozłączono:', reason);
      });
    }
    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
