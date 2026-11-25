import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Publicacion } from '../../models/interfaces';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-section">
      <h2>Artículos Disponibles en el Campus</h2>
      <button *ngIf="api.usuarioActual" (click)="mostrarForm = !mostrarForm" class="btn-primary">
        {{ mostrarForm ? 'Cerrar Formulario' : '+ Publicar Artículo' }}
      </button>
    </div>

    <div *ngIf="mensajeOk" class="alert-success">{{ mensajeOk }}</div>
    <div *ngIf="mensajeError" class="alert-error">{{ mensajeError }}</div>

    <!-- Formulario para crear publicación -->
    <div *ngIf="mostrarForm" class="card form-box">
      <h3>Publicar nuevo artículo</h3>
      <form (ngSubmit)="crearPublicacion()">
        <input type="text" [(ngModel)]="nuevaPub.titulo" name="titulo" placeholder="Título (ej: Calculadora Científica)" required />
        <textarea [(ngModel)]="nuevaPub.descripcion" name="descripcion" placeholder="Descripción y estado del artículo" required></textarea>
        <select [(ngModel)]="nuevaPub.categoria" name="categoria">
          <option value="Libros y Apuntes">Libros y Apuntes</option>
          <option value="Electrónica y Componentes">Electrónica y Componentes</option>
          <option value="Calculadoras y Herramientas">Calculadoras y Herramientas</option>
          <option value="Otros">Otros</option>
        </select>
        <select [(ngModel)]="nuevaPub.modalidad" name="modalidad">
          <option value="DONACION">DONACIÓN</option>
          <option value="INTERCAMBIO">INTERCAMBIO</option>
        </select>
        <button type="submit" class="btn-primary">Guardar Publicación</button>
      </form>
    </div>

    <!-- Listado de publicaciones -->
    <div class="grid">
      <div *ngFor="let p of publicaciones" class="card item-card">
        <div class="badges">
          <span class="badge modalidad">{{ p.modalidad }}</span>
          <span class="badge estado" [ngClass]="p.estado.toLowerCase()">{{ p.estado }}</span>
        </div>
        <h3>{{ p.titulo }}</h3>
        <p>{{ p.descripcion }}</p>
        <small>Categoría: {{ p.categoria }} | Publicado por: <strong>{{ p.propietarioNombre }}</strong></small>

        <div class="actions" *ngIf="api.usuarioActual">
          <!-- Solicitar (si no es dueño y está DISPONIBLE) -->
          <div *ngIf="p.usuarioId !== api.usuarioActual.id && p.estado === 'DISPONIBLE'" class="solicitar-box">
            <input type="text" [(ngModel)]="mensajesSolicitud[p.id]" placeholder="Escribe tu mensaje o propuesta..." />
            <button (click)="solicitar(p.id)" class="btn-success">Solicitar</button>
          </div>

          <!-- Cancelar publicación propia si está DISPONIBLE -->
          <button *ngIf="p.usuarioId === api.usuarioActual.id && p.estado === 'DISPONIBLE'"
                  (click)="cancelarPub(p.id)" class="btn-danger">
            Cancelar Publicación
          </button>
        </div>
      </div>
    </div>
  `
})
export class CatalogoComponent implements OnInit {
  publicaciones: Publicacion[] = [];
  mostrarForm = false;
  mensajeOk = '';
  mensajeError = '';
  mensajesSolicitud: { [id: number]: string } = {};

  nuevaPub = {
    titulo: '',
    descripcion: '',
    categoria: 'Libros y Apuntes',
    modalidad: 'DONACION' as 'DONACION' | 'INTERCAMBIO'
  };

  constructor(public api: ApiService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.api.getPublicaciones().subscribe({
      next: (data) => (this.publicaciones = data),
      error: () => (this.mensajeError = 'No se pudo conectar con el servidor.')
    });
  }

  crearPublicacion() {
    this.limpiarAlertas();
    this.api.crearPublicacion(this.nuevaPub).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.mostrarForm = false;
        this.nuevaPub = { titulo: '', descripcion: '', categoria: 'Libros y Apuntes', modalidad: 'DONACION' };
        this.cargar();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al publicar.')
    });
  }

  solicitar(publicacionId: number) {
    this.limpiarAlertas();
    const msg = this.mensajesSolicitud[publicacionId];
    if (!msg) {
      this.mensajeError = 'Escribe un mensaje antes de enviar la solicitud.';
      return;
    }
    this.api.crearSolicitud(publicacionId, msg).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.mensajesSolicitud[publicacionId] = '';
        this.cargar();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al solicitar.')
    });
  }

  cancelarPub(id: number) {
    this.limpiarAlertas();
    this.api.cancelarPublicacion(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargar();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cancelar.')
    });
  }

  limpiarAlertas() {
    this.mensajeOk = '';
    this.mensajeError = '';
  }
}