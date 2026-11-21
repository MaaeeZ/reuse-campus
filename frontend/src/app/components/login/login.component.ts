import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-card">
      <h2>Iniciar Sesión – ReUse Campus</h2>
      <p class="subtitle">Plataforma de Economía Circular IPVG</p>

      <div *ngIf="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form (ngSubmit)="onLogin()">
        <label>Correo institucional:</label>
        <input type="email" [(ngModel)]="correo" name="correo" placeholder="ej: carlos@ipvg.cl" required />

        <label>Contraseña:</label>
        <input type="password" [(ngModel)]="password" name="password" placeholder="123456" required />

        <button type="submit" class="btn-primary" [disabled]="cargando">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <div class="demo-users">
        <strong>Cuentas de prueba rápidas:</strong>
        <button type="button" (click)="autocompletar('carlos@ipvg.cl')">Carlos (Propietario)</button>
        <button type="button" (click)="autocompletar('ana@ipvg.cl')">Ana (Solicitante 1)</button>
        <button type="button" (click)="autocompletar('luis@ipvg.cl')">Luis (Solicitante 2)</button>
        <button type="button" (click)="autocompletar('admin@ipvg.cl')">Admin IPVG</button>
      </div>
    </div>
  `
})
export class LoginComponent {
  correo = '';
  password = '';
  errorMsg = '';
  cargando = false;

  constructor(private api: ApiService, private router: Router) {}

  autocompletar(correo: string) {
    this.correo = correo;
    this.password = '123456';
  }

  onLogin() {
    this.errorMsg = '';
    this.cargando = true;
    this.api.login(this.correo, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMsg = err.error?.error || 'Error de conexión con el servidor.';
      }
    });
  }
}