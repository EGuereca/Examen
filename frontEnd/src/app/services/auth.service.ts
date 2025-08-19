import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse, 
  MeResponse, 
  LogoutResponse 
} from '../models/user.model';
import { environment } from '../environments/enviroment';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  #http = inject(HttpClient);
  #router = inject(Router);
  private _user$ = new BehaviorSubject<MeResponse['data'] | null>(null);
  public userChanges$ = this._user$.asObservable();

  fetchMe(): Observable<MeResponse> {
    return this.#http.get<MeResponse>(
      `${environment.apiBaseUrl}/me`
    ).pipe(
      tap(res => this._user$.next(res.data))
    );
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.#http.post<LoginResponse>(
      `${environment.apiBaseUrl}/login`, data, { withCredentials: true }
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.#http.post<RegisterResponse>(
      `${environment.apiBaseUrl}/register`, data, { withCredentials: true }
    ).pipe(
      tap(() => {
        this.fetchMe().subscribe();
      })
    );
  }

  logout(): Observable<any> {
    return this.#http
      .post(`${environment.apiBaseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._user$.next(null);
          localStorage.removeItem('access_token');
          this.#router.navigate(['/login'], { replaceUrl: true });
        })
      );
  }

  forceLogout() {
    localStorage.removeItem('access_token');
    this._user$.next(null);
    this.#router.navigate(['/login'], { replaceUrl: true });
  }
}
