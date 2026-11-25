import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Usuario } from '../../models/interfaces';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>Panel de Administración de Usuarios</h2>
      <div *ngIf="errorMsg" class="alert-error">{{ errorMsg }}</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of usuarios">
            <td>{{ u.id }}</td>
            <td>{{ u.nombre }}</td>
            <td>{{ u.correo }}</td>
            <td>{{ u.rol }}</td>
            <td>{{ u.estado }}</td>
            <td>
              <button *ngIf="u.rol !== 'Administrador'" (click)="toggleEstado(u)" class="btn-primary">
                {{ u.estado === 'ACTIVO' ? 'Suspender' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class AdminComponent implements OnInit {
  usuarios: Usuario[] = [];
  errorMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.api.getUsuarios().subscribe({
      next: (data) => (this.usuarios = data),
      error: (err) => (this.errorMsg = err.error?.error || 'Acceso denegado.')
    });
  }

  toggleEstado(u: Usuario) {
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.api.cambiarEstadoUsuario(u.id, nuevoEstado).subscribe({
      next: () => this.cargar(),
      error: (err) => (this.errorMsg = err.error?.error || 'Error al actualizar.')
    });
  }
}