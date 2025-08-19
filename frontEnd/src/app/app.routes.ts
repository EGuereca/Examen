import { Routes } from '@angular/router';
import { Login } from './pages/login/login.component';
import { Register } from './pages/register/register.component';
import { LobbyComponent } from './pages/lobby/lobby.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'lobby', component: LobbyComponent },
  { path: '**', redirectTo: '/login' }
];