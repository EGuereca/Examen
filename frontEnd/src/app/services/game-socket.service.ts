import { Injectable } from '@angular/core';
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

  constructor() {}

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
    if (!this.socket?.connected) {
      console.error('Socket not connected');
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
   * Setup all socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to game server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      this.resetGameState();
    });

    // Game events
    this.socket.on('playerJoined', (data: PlayerJoinedEvent) => {
      console.log('👤 Player joined:', data.userId);
      this.handlePlayerJoined(data);
    });

    this.socket.on('playerReady', (data: PlayerReadyEvent) => {
      console.log('✅ Player ready:', data.userId, 'Boat:', data.boatChoice);
      this.handlePlayerReady(data);
    });

    this.socket.on('gameReady', (data: GameReadyEvent) => {
      console.log('🎮 Game ready:', data.gameId);
      this.handleGameReady(data);
    });

    this.socket.on('start', (data: StartEvent) => {
      console.log('🚀 Game started with boat:', data.boat);
      this.handleGameStart(data);
    });

    this.socket.on('updateBoat', (data: UpdateBoatEvent) => {
      this.handleBoatUpdate(data);
    });

    this.socket.on('winner', (data: WinnerEvent) => {
      console.log('🏆 Winner:', data.winner);
      this.handleGameWinner(data);
    });

    this.socket.on('error', (data: ErrorEvent) => {
      console.error('❌ Socket error:', data.msg);
      this.handleSocketError(data);
    });
  }

  /**
   * Handle player joined event
   */
  private handlePlayerJoined(data: PlayerJoinedEvent): void {
    // Update game players list if needed
    // This could trigger a refresh of the game state
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
    }
  }

  /**
   * Handle game ready event
   */
  private handleGameReady(data: GameReadyEvent): void {
    this.gameStatusSubject.next('ready');
    
    const currentGame = this.currentGameSubject.value;
    if (currentGame) {
      this.currentGameSubject.next({
        ...currentGame,
        status: 'ready'
      });
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
      this.currentGameSubject.next({
        ...currentGame,
        status: 'in_progress'
      });
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
      this.currentGameSubject.next({
        ...currentGame,
        status: 'finished',
        winnerId: data.winner
      });
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
