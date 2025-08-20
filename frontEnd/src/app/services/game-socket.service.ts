import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { Game, GamePlayer, GameStatus, Boat } from '../models/game.model';

// Socket event payloads
export interface JoinGamePayload {
  gameId: number;
  userId: number;
}

export interface ChooseBoatPayload {
  gameId: number;
  userId: number;
  boatChoice: string;
}

export interface StartGamePayload {
  gameId: number;
  userId: number;
}

export interface ClickBoatPayload {
  gameId: number;
  userId: number;
}

export interface LeaveGamePayload {
  gameId: number;
  userId: number;
}

// Socket event responses
export interface PlayerJoinedEvent {
  userId: number;
}

export interface PlayerReadyEvent {
  userId: number;
  boatChoice: string;
}

export interface GameReadyEvent {
  gameId: number;
}

export interface StartEvent {
  boat: Boat;
}

export interface UpdateBoatEvent {
  boat: Boat;
}

export interface WinnerEvent {
  winner: number;
}

export interface ErrorEvent {
  msg: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameSocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = 'http://localhost:3334';
  private pendingJoinPayload: JoinGamePayload | null = null;

  // Game state observables
  private currentGameSubject = new BehaviorSubject<Game | null>(null);
  private currentBoatSubject = new BehaviorSubject<Boat | null>(null);
  private gamePlayersSubject = new BehaviorSubject<GamePlayer[]>([]);
  private gameStatusSubject = new BehaviorSubject<GameStatus>('waiting');

  // Public observables
  public currentGame$ = this.currentGameSubject.asObservable();
  public currentBoat$ = this.currentBoatSubject.asObservable();
  public gamePlayers$ = this.gamePlayersSubject.asObservable();
  public gameStatus$ = this.gameStatusSubject.asObservable();

  constructor(private zone: NgZone) {}

  /**
   * Connect to the socket server
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a game room
   */
  joinGame(payload: JoinGamePayload): void {
    if (!this.socket || !this.socket.connected) {
      this.pendingJoinPayload = payload;
      this.connect();
      return;
    }

    this.socket.emit('join', payload);
  }

  /**
   * Choose a boat for the player
   */
  chooseBoat(payload: ChooseBoatPayload): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('chooseBoat', payload);
  }

  /**
   * Start the game (creator only)
   */
  startGame(payload: StartGamePayload): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('startGame', payload);
  }

  /**
   * Click on the boat (gameplay action)
   */
  clickBoat(payload: ClickBoatPayload): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('clickBoat', payload);
  }

  /**
   * Leave the game room
   */
  leaveGame(payload: LeaveGamePayload): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('leaveGame', payload);
    this.resetGameState();
  }

  /**
   * Setup all socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.zone.run(() => {
        console.log('🔌 Connected to game server');
        if (this.pendingJoinPayload) {
          this.socket!.emit('join', this.pendingJoinPayload);
          this.pendingJoinPayload = null;
        }
      });
    });

    this.socket.on('disconnect', () => {
      this.zone.run(() => {
        console.log('❌ Disconnected from game server');
        this.resetGameState();
      });
    });

    // Game events
    this.socket.on('syncGame', (data: { game: Game }) => {
      this.zone.run(() => {
        // Inicializa estado completo para el cliente que se acaba de unir
        const game = data.game
        this.currentGameSubject.next(game)
        this.gameStatusSubject.next(game.status)
        if (game.players) {
          this.gamePlayersSubject.next(game.players)
        }
      });
    });
    this.socket.on('playerJoined', (data: PlayerJoinedEvent) => {
      this.zone.run(() => {
        console.log('👤 Player joined:', data.userId);
        this.handlePlayerJoined(data);
      });
    });

    this.socket.on('playerReady', (data: PlayerReadyEvent) => {
      this.zone.run(() => {
        console.log('✅ Player ready:', data.userId, 'Boat:', data.boatChoice);
        this.handlePlayerReady(data);
      });
    });

    this.socket.on('playerNotReady', (data: { userId: number }) => {
      this.zone.run(() => {
        console.log('⏳ Player not ready:', data.userId);
        this.handlePlayerNotReady(data.userId);
      });
    });

    this.socket.on('gameReady', (data: GameReadyEvent) => {
      this.zone.run(() => {
        console.log('🎮 Game ready:', data.gameId);
        this.handleGameReady(data);
      });
    });

    this.socket.on('gameWaiting', (data: { gameId: number }) => {
      this.zone.run(() => {
        console.log('🕓 Game back to waiting:', data.gameId);
        this.handleGameWaiting(data.gameId);
      });
    });

    this.socket.on('start', (data: StartEvent) => {
      this.zone.run(() => {
        console.log('🚀 Game started with boat:', data.boat);
        this.handleGameStart(data);
      });
    });

    this.socket.on('updateBoat', (data: UpdateBoatEvent) => {
      this.zone.run(() => {
        this.handleBoatUpdate(data);
      });
    });

    this.socket.on('winner', (data: WinnerEvent) => {
      this.zone.run(() => {
        console.log('🏆 Winner:', data.winner);
        this.handleGameWinner(data);
      });
    });

    this.socket.on('error', (data: ErrorEvent) => {
      this.zone.run(() => {
        console.error('❌ Socket error:', data.msg);
        this.handleSocketError(data);
      });
    });
  }

  /**
   * Handle player joined event
   */
  private handlePlayerJoined(data: PlayerJoinedEvent): void {
    const currentGame = this.currentGameSubject.value;
    if (!currentGame) return;
    const currentPlayers = currentGame.players ? [...currentGame.players] : [];
    const exists = currentPlayers.some((p) => p.userId === data.userId);
    if (!exists) {
      const newPlayer: GamePlayer = {
        id: 0,
        gameId: currentGame.id,
        userId: data.userId,
        socketId: null,
        boatChoice: null,
        ready: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as GamePlayer;
      currentPlayers.push(newPlayer);
    }
    this.currentGameSubject.next({ ...currentGame, players: currentPlayers });
    this.gamePlayersSubject.next(currentPlayers);
  }

  /**
   * Handle player ready event
   */
  private handlePlayerReady(data: PlayerReadyEvent): void {
    // Update player ready status in the current game
    const currentGame = this.currentGameSubject.value;
    if (currentGame?.players) {
      const updatedPlayers = currentGame.players.map(player => {
        if (player.userId === data.userId) {
          return { ...player, ready: true, boatChoice: data.boatChoice };
        }
        return player;
      });
      
      this.currentGameSubject.next({
        ...currentGame,
        players: updatedPlayers
      });
      this.gamePlayersSubject.next(updatedPlayers);
    }
  }

  /**
   * Handle player not ready (on disconnect)
   */
  private handlePlayerNotReady(userId: number): void {
    const currentGame = this.currentGameSubject.value
    if (currentGame?.players) {
      const updatedPlayers = currentGame.players.map(player => {
        if (player.userId === userId) {
          return { ...player, ready: false }
        }
        return player
      })

      this.currentGameSubject.next({
        ...currentGame,
        players: updatedPlayers
      })
      this.gamePlayersSubject.next(updatedPlayers)
    }
  }

  /**
   * Handle game ready event
   */
  private handleGameReady(data: GameReadyEvent): void {
    this.gameStatusSubject.next('ready');
    
    const currentGame = this.currentGameSubject.value;
    if (currentGame) {
      const nextGame = { ...currentGame, status: 'ready' as GameStatus };
      this.currentGameSubject.next(nextGame);
    }
  }

  /**
   * Handle game back to waiting
   */
  private handleGameWaiting(gameId: number): void {
    this.gameStatusSubject.next('waiting')

    const currentGame = this.currentGameSubject.value
    if (currentGame && currentGame.id === gameId) {
      const nextGame = { ...currentGame, status: 'waiting' as GameStatus }
      this.currentGameSubject.next(nextGame)
    }
  }

  /**
   * Handle game start event
   */
  private handleGameStart(data: StartEvent): void {
    this.gameStatusSubject.next('in_progress');
    this.currentBoatSubject.next(data.boat);
    
    const currentGame = this.currentGameSubject.value;
    if (currentGame) {
      const nextGame = { ...currentGame, status: 'in_progress' as GameStatus };
      this.currentGameSubject.next(nextGame);
    }
  }

  /**
   * Handle boat update event
   */
  private handleBoatUpdate(data: UpdateBoatEvent): void {
    this.currentBoatSubject.next(data.boat);
  }

  /**
   * Handle game winner event
   */
  private handleGameWinner(data: WinnerEvent): void {
    this.gameStatusSubject.next('finished');
    
    const currentGame = this.currentGameSubject.value;
    if (currentGame) {
      const nextGame = { ...currentGame, status: 'finished' as GameStatus, winnerId: data.winner };
      this.currentGameSubject.next(nextGame);
    }
  }

  /**
   * Handle socket error event
   */
  private handleSocketError(data: ErrorEvent): void {
    // Emit error to components or handle as needed
    console.error('Game socket error:', data.msg);
  }

  /**
   * Reset all game state
   */
  private resetGameState(): void {
    this.currentGameSubject.next(null);
    this.currentBoatSubject.next(null);
    this.gamePlayersSubject.next([]);
    this.gameStatusSubject.next('waiting');
  }

  /**
   * Set the current game
   */
  setCurrentGame(game: Game): void {
    this.currentGameSubject.next(game);
    this.gameStatusSubject.next(game.status);
    
    if (game.players) {
      this.gamePlayersSubject.next(game.players);
    }
  }

  /**
   * Get current game value
   */
  getCurrentGame(): Game | null {
    return this.currentGameSubject.value;
  }

  /**
   * Get current boat value
   */
  getCurrentBoat(): Boat | null {
    return this.currentBoatSubject.value;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
