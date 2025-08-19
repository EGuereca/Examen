import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">Lobby</h1>
            </div>
            <div class="flex items-center">
              <button
                (click)="logout()"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido!</h2>
              <p class="text-gray-600">Has iniciado sesión correctamente.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
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
