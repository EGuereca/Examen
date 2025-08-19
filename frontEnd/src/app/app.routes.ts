import { Routes } from '@angular/router';
import { Login } from './pages/login/login.component';
import { Register } from './pages/register/register.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { GameComponent } from './pages/game/game.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'lobby', component: LobbyComponent, canActivate: [AuthGuard] },
  { path: 'game/:id', component: GameComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];