import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
      <button *ngIf="api.usuarioActual" (click)="abrirCrear()" class="btn-primary">
        {{ mostrarForm ? 'Cerrar Formulario' : '+ Publicar Artículo' }}
      </button>
    </div>

    <div *ngIf="mensajeOk" class="alert-success">{{ mensajeOk }}</div>
    <div *ngIf="mensajeError" class="alert-error">{{ mensajeError }}</div>

    <!-- Filtros rápidos -->
    <div class="card" style="display: flex; gap: 1rem; padding: 1rem;">
      <select [(ngModel)]="filtroEstado" (change)="cdr.detectChanges()" style="margin:0;">
        <option value="TODOS">Todos los estados</option>
        <option value="DISPONIBLE">DISPONIBLE</option>
        <option value="RESERVADA">RESERVADA</option>
        <option value="ENTREGADA">ENTREGADA</option>
        <option value="CANCELADA">CANCELADA</option>
      </select>
      <select [(ngModel)]="filtroModalidad" (change)="cdr.detectChanges()" style="margin:0;">
        <option value="TODAS">Todas las modalidades</option>
        <option value="DONACION">DONACIÓN</option>
        <option value="INTERCAMBIO">INTERCAMBIO</option>
      </select>
    </div>

    <!-- Formulario Crear / Editar Publicación -->
    <div *ngIf="mostrarForm" class="card form-box">
      <h3>{{ editandoId ? 'Editar publicación #' + editandoId : 'Publicar nuevo artículo' }}</h3>
      <form (ngSubmit)="guardarPublicacion()">
        <input type="text" [(ngModel)]="formPub.titulo" name="titulo" placeholder="Título (ej: Calculadora Científica)" required />
        <textarea [(ngModel)]="formPub.descripcion" name="descripcion" placeholder="Descripción y estado del artículo" required></textarea>
        <select [(ngModel)]="formPub.categoria" name="categoria">
          <option value="Libros y Apuntes">Libros y Apuntes</option>
          <option value="Electrónica y Componentes">Electrónica y Componentes</option>
          <option value="Calculadoras y Herramientas">Calculadoras y Herramientas</option>
          <option value="Otros">Otros</option>
        </select>
        <select [(ngModel)]="formPub.modalidad" name="modalidad">
          <option value="DONACION">DONACIÓN</option>
          <option value="INTERCAMBIO">INTERCAMBIO</option>
        </select>
        <button type="submit" class="btn-primary">
          {{ editandoId ? 'Actualizar Publicación' : 'Guardar Publicación' }}
        </button>
      </form>
    </div>

    <!-- Listado de publicaciones -->
    <div class="grid">
      <div *ngFor="let p of publicacionesFiltradas" class="card item-card">
        <div class="badges">
          <span class="badge modalidad">{{ p.modalidad }}</span>
          <span class="badge estado" [ngClass]="p.estado.toLowerCase()">{{ p.estado }}</span>
        </div>
        <h3>{{ p.titulo }}</h3>
        <p>{{ p.descripcion }}</p>
        <small>Categoría: {{ p.categoria }} | Publicado por: <strong>{{ p.propietarioNombre }}</strong></small>

        <div class="actions" *ngIf="api.usuarioActual" style="margin-top: 1rem;">
          <!-- Solicitar (si no es dueño y está DISPONIBLE) -->
          <div *ngIf="Number(p.usuarioId) !== Number(api.usuarioActual.id) && p.estado === 'DISPONIBLE'" class="solicitar-box">
            <input type="text" [(ngModel)]="mensajesSolicitud[p.id]" placeholder="Escribe tu mensaje o propuesta..." />
            <button (click)="solicitar(p.id)" class="btn-success">Solicitar</button>
          </div>

          <!-- Editar o Cancelar publicación propia si está DISPONIBLE -->
          <ng-container *ngIf="Number(p.usuarioId) === Number(api.usuarioActual.id) && p.estado === 'DISPONIBLE'">
            <button (click)="iniciarEdicion(p)" class="btn-primary">Editar</button>
            <button (click)="cancelarPub(p.id)" class="btn-danger">Cancelar</button>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class CatalogoComponent implements OnInit {
  publicaciones: Publicacion[] = [];
  mostrarForm = false;
  editandoId: number | null = null;
  mensajeOk = '';
  mensajeError = '';
  mensajesSolicitud: { [id: number]: string } = {};
  filtroEstado = 'TODOS';
  filtroModalidad = 'TODAS';
  Number = Number;

  formPub = {
    titulo: '',
    descripcion: '',
    categoria: 'Libros y Apuntes',
    modalidad: 'DONACION' as 'DONACION' | 'INTERCAMBIO'
  };

  constructor(public api: ApiService, public cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
  }

  get publicacionesFiltradas(): Publicacion[] {
    return this.publicaciones.filter((p) => {
      const okEstado = this.filtroEstado === 'TODOS' || p.estado === this.filtroEstado;
      const okMod = this.filtroModalidad === 'TODAS' || p.modalidad === this.filtroModalidad;
      return okEstado && okMod;
    });
  }

  cargar() {
    this.api.getPublicaciones().subscribe({
      next: (data) => {
        this.publicaciones = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  abrirCrear() {
    this.editandoId = null;
    this.formPub = { titulo: '', descripcion: '', categoria: 'Libros y Apuntes', modalidad: 'DONACION' };
    this.mostrarForm = !this.mostrarForm;
  }

  iniciarEdicion(p: Publicacion) {
    this.editandoId = p.id;
    this.formPub = {
      titulo: p.titulo,
      descripcion: p.descripcion,
      categoria: p.categoria,
      modalidad: p.modalidad
    };
    this.mostrarForm = true;
  }

  guardarPublicacion() {
    this.limpiarAlertas();
    const peticion = this.editandoId
      ? this.api.editarPublicacion(this.editandoId, this.formPub)
      : this.api.crearPublicacion(this.formPub);

    peticion.subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.mostrarForm = false;
        this.editandoId = null;
        this.formPub = { titulo: '', descripcion: '', categoria: 'Libros y Apuntes', modalidad: 'DONACION' };
        this.cargar();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al guardar publicación.';
        this.cdr.detectChanges();
      }
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
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al solicitar.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelarPub(id: number) {
    this.limpiarAlertas();
    this.api.cancelarPublicacion(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargar();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al cancelar.';
        this.cdr.detectChanges();
      }
    });
  }

  limpiarAlertas() {
    this.mensajeOk = '';
    this.mensajeError = '';
  }
}