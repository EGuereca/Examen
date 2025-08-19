import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/enviroment';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Game, GamePlayer, User, CreateGameRequest, CreateGameResponse, GetGamesResponse, JoinGameRequest, JoinGameResponse } from '../models/game.model';


@Injectable({
    providedIn: 'root'
})
export class GameService {
    #http = inject(HttpClient);
    #router = inject(Router);

    getGames(): Observable<GetGamesResponse> {
        console.log('GameService: Making GET request to:', `${environment.apiBaseUrl}/api/games`);
        return this.#http.get<GetGamesResponse>(
            `${environment.apiBaseUrl}/api/games`
        );
    }

    createGame(): Observable<CreateGameResponse> {
        return this.#http.post<CreateGameResponse>(
            `${environment.apiBaseUrl}/api/games`, {}
        );
    }

    joinGame(gameId: number): Observable<JoinGameResponse> {
        return this.#http.post<JoinGameResponse>(
            `${environment.apiBaseUrl}/api/games/${gameId}/join`, {}
        );
    }

}
