import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html'
})
export class LobbyComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

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
