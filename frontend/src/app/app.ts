import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <nav class="navbar">
      <div class="brand">♻️ ReUse Campus IPVG</div>
      <div class="links" *ngIf="api.usuario$ | async as user; else guestLinks">
        <a routerLink="/catalogo">Catálogo</a>
        <a routerLink="/mis-gestiones">Mis Solicitudes y Entregas</a>
        <a *ngIf="user.rol === 'Administrador'" routerLink="/admin">Panel Admin</a>
        <span class="user-badge">{{ user.nombre }} ({{ user.rol }})</span>
        <button (click)="salir()" class="btn-logout">Salir</button>
      </div>
      <ng-template #guestLinks>
        <a routerLink="/login">Iniciar Sesión</a>
      </ng-template>
    </nav>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `
})
export class App {
  constructor(public api: ApiService, private router: Router) {}

  salir() {
    this.api.logout();
    this.router.navigate(['/login']);
  }
}