import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { Game } from '../../models/game.model';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html'
})
export class LobbyComponent implements OnInit {
  games: Game[] = [];
  isLoading = false;
  isCreatingGame = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private gameService: GameService
  ) {}

  ngOnInit() {
    console.log('LobbyComponent initialized, loading games...');
    this.loadGames();
  }

  loadGames() {
    console.log('Starting to load games...');
    this.isLoading = true;
    this.gameService.getGames().subscribe({
      next: (response) => {
        console.log('Games loaded successfully:', response);
        this.games = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading games:', error);
        this.isLoading = false;
      }
    });
  }

  createGame() {
    this.isCreatingGame = true;
    this.gameService.createGame().subscribe({
      next: (response) => {
        console.log('Game created successfully:', response);
        this.loadGames(); // Reload games list
        this.isCreatingGame = false;
      },
      error: (error) => {
        console.error('Error creating game:', error);
        this.isCreatingGame = false;
      }
    });
  }

  joinGame(gameId: number) {
    this.gameService.joinGame(gameId).subscribe({
      next: (response) => {
        console.log('Joined game successfully:', response);
        this.loadGames(); // Reload games list to update player count
      },
      error: (error) => {
        console.error('Error joining game:', error);
      }
    });
  }

  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'waiting': 'Esperando jugadores',
      'ready': 'Listo para comenzar',
      'in_progress': 'En progreso',
      'finished': 'Terminado'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'waiting': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'finished': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  canJoinGame(game: Game): boolean {
    return game.status === 'waiting' && (game.players?.length || 0) < 2;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        // El servicio ya maneja la navegación
      },
      error: () => {
        // En caso de error, forzar logout
        this.auth.forceLogout();
      }
    });
  }
}
