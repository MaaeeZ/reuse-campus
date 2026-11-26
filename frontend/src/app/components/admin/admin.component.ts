import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
      <div *ngIf="mensajeOk" class="alert-success">{{ mensajeOk }}</div>
      <div *ngIf="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <p *ngIf="usuarios.length === 0 && !errorMsg">Cargando usuarios...</p>

      <table *ngIf="usuarios.length > 0">
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
            <td>
              <span class="badge" [ngClass]="u.estado === 'ACTIVO' ? 'disponible' : 'cancelada'">
                {{ u.estado }}
              </span>
            </td>
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
  mensajeOk = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.errorMsg = '';
    this.api.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Acceso denegado o error de conexión.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleEstado(u: Usuario) {
    this.mensajeOk = '';
    this.errorMsg = '';
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.api.cambiarEstadoUsuario(u.id, nuevoEstado).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargar();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Error al actualizar usuario.';
        this.cdr.detectChanges();
      }
    });
  }
}