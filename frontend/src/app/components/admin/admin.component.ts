import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Usuario } from '../../models/interfaces';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
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