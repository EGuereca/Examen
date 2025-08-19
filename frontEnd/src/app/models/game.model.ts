// Game Status Types
export type GameStatus = 'waiting' | 'ready' | 'in_progress' | 'finished';

// Base Models
export interface User {
  id: number;
  fullName: string | null;
  email: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface GamePlayer {
  id: number;
  gameId: number;
  userId: number;
  socketId: string | null;
  boatChoice: string | null;
  ready: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  game?: Game;
}

export interface Game {
  id: number;
  creatorId: number;
  status: GameStatus;
  winnerId: number | null;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  winner?: User;
  players?: GamePlayer[];
  boats?: any[]; // Boat interface can be added later if needed
}

// Request Interfaces
export interface CreateGameRequest {
  // No body parameters needed for create game
}

export interface JoinGameRequest {
  // No body parameters needed for join game
}

// Response Interfaces
export interface CreateGameResponse {
  message: string;
  data: Game;
}

export interface GetGamesResponse {
  data: Game[];
}

export interface JoinGameResponse {
  message: string;
  data: {
    game: Game;
    player: GamePlayer;
  };
}

// API Response Wrapper
export interface ApiResponse<T> {
  message?: string;
  data: T;
  error?: string;
}

// Specific Response Types
export type CreateGameApiResponse = ApiResponse<Game>;
export type GetGamesApiResponse = ApiResponse<Game[]>;
export type JoinGameApiResponse = ApiResponse<{
  game: Game;
  player: GamePlayer;
}>;
