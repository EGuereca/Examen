import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSocketService } from '../../services/game-socket.service';
import { Boat, Game, GamePlayer, GameStatus } from '../../models/game.model';
import { Observable } from 'rxjs';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #socket = inject(GameSocketService);
  #gameService = inject(GameService);

  gameId: number | null = null;
  userId: number | null = null;
  game: Game | null = null;
  boat: Boat | null = null;
  status: GameStatus = 'waiting';
  players: GamePlayer[] = [];

  selectedScreen: number | null = null;

  // Reactive streams for template (async pipe)
  game$!: Observable<Game | null>;
  boat$!: Observable<Boat | null>;
  players$!: Observable<GamePlayer[]>;
  status$!: Observable<GameStatus>;

  ngOnInit(): void {
    const idParam = this.#route.snapshot.paramMap.get('id');
    this.gameId = idParam ? Number(idParam) : null;

    const nav = this.#router.getCurrentNavigation();
    const stateData: any = nav?.extras?.state || null;

    if (!this.gameId) {
      this.#router.navigate(['/lobby']);
      return;
    }

    if (stateData?.data?.game && stateData?.data?.player) {
      this.initializeFromServer(stateData.data.game as Game, stateData.data.player as GamePlayer);
    } else {
      // Rehydrate when accessing directly via URL or refresh
      this.#gameService.joinGame(this.gameId).subscribe({
        next: (response) => {
          const game = response.data.game as Game;
          const player = response.data.player as GamePlayer;
          this.initializeFromServer(game, player);
        },
        error: () => {
          this.#router.navigate(['/lobby']);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.#socket.disconnect();
  }

  chooseScreen(choice: number): void {
    if (!this.gameId || !this.userId) return;
    this.selectedScreen = choice;
    this.#socket.chooseBoat({
      gameId: this.gameId,
      userId: this.userId,
      boatChoice: String(choice),
    });
  }

  // Derived helpers for template
  get screenNumbers(): number[] {
    const total = this.players?.length || 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  isScreenTaken(screen: number): boolean {
    return this.players?.some((p) => Number(p.boatChoice) === screen) || false;
  }

  canStartGame(): boolean {
    if (!this.game || this.status !== 'ready') return false;
    return this.userId === this.game.creatorId;
  }

  startGame(): void {
    if (!this.gameId || !this.userId) return;
    this.#socket.startGame({
      gameId: this.gameId,
      userId: this.userId,
    });
  }

  clickBoat(): void {
    if (!this.gameId || !this.userId) return;
    this.#socket.clickBoat({
      gameId: this.gameId,
      userId: this.userId,
    });
  }

  goLobby(): void {
    this.#router.navigate(['/lobby']);
  }

  leaveGame(): void {
    if (!this.gameId || !this.userId) {
      this.goLobby();
      return;
    }
    this.#socket.leaveGame({
      gameId: this.gameId,
      userId: this.userId,
    });
    this.goLobby();
  }

  private initializeFromServer(game: Game, player: GamePlayer): void {
    this.game = game;
    this.players = game.players || [];
    this.status = game.status;
    this.userId = player.userId;

    this.#socket.setCurrentGame(game);
    this.#socket.connect();

    this.#socket.joinGame({
      gameId: game.id,
      userId: player.userId,
    });

    // Bind reactive streams for template
    this.game$ = this.#socket.currentGame$;
    this.boat$ = this.#socket.currentBoat$;
    this.players$ = this.#socket.gamePlayers$;
    this.status$ = this.#socket.gameStatus$;

    // Keep local mirrors for imperative checks
    this.#socket.currentGame$.subscribe((g) => {
      if (g) {
        this.game = g;
        this.players = g.players || [];
        this.status = g.status;
        // Sync selected screen from my player state
        const me = this.players.find(p => p.userId === this.userId);
        const screenNum = me && me.boatChoice != null ? Number(me.boatChoice) : null;
        this.selectedScreen = Number.isFinite(screenNum as number) ? (screenNum as number) : null;
      }
    });

    this.#socket.currentBoat$.subscribe((b) => {
      this.boat = b;
    });

    this.#socket.gameStatus$.subscribe((s) => {
      this.status = s;
    });

    // Keep players mirrored from stream to ensure dynamic screen count updates
    this.#socket.gamePlayers$.subscribe((pl) => {
      this.players = pl || [];
      const me = this.players.find(p => p.userId === this.userId);
      const screenNum = me && me.boatChoice != null ? Number(me.boatChoice) : null;
      this.selectedScreen = Number.isFinite(screenNum as number) ? (screenNum as number) : this.selectedScreen;
    });
  }
}
