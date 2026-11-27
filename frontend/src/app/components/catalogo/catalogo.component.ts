import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Publicacion } from '../../models/interfaces';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
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