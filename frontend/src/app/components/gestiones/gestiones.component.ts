import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Solicitud, EntregaIntercambio } from '../../models/interfaces';

@Component({
  selector: 'app-gestiones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestiones.component.html',
  styleUrl: './gestiones.component.css'
})
export class GestionesComponent implements OnInit {
  solicitudesRecibidas: Solicitud[] = [];
  solicitudesEnviadas: Solicitud[] = [];
  misEntregas: EntregaIntercambio[] = [];
  mensajeOk = '';
  mensajeError = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    const uid = this.api.usuarioActual?.id;
    if (!uid) return;

    this.api.getSolicitudes().subscribe({
      next: (data) => {
        this.solicitudesRecibidas = data.filter((s) => Number(s.propietarioId) === Number(uid));
        this.solicitudesEnviadas = data.filter((s) => Number(s.solicitanteId) === Number(uid));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al cargar solicitudes.';
        this.cdr.detectChanges();
      }
    });

    this.api.getEntregas().subscribe({
      next: (data) => {
        this.misEntregas = data.filter(
          (e) => Number(e.propietarioId) === Number(uid) || Number(e.receptorId) === Number(uid)
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al cargar entregas.';
        this.cdr.detectChanges();
      }
    });
  }

  aceptar(id: number) {
    this.mensajeOk = '';
    this.mensajeError = '';
    this.api.aceptarSolicitud(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargarTodo();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al aceptar.';
        this.cdr.detectChanges();
      }
    });
  }

  rechazar(id: number) {
    this.mensajeOk = '';
    this.mensajeError = '';
    this.api.rechazarSolicitud(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargarTodo();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al rechazar.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelarSol(id: number) {
    this.mensajeOk = '';
    this.mensajeError = '';
    this.api.cancelarSolicitud(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargarTodo();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al cancelar.';
        this.cdr.detectChanges();
      }
    });
  }

  completar(id: number) {
    this.mensajeOk = '';
    this.mensajeError = '';
    this.api.completarEntrega(id).subscribe({
      next: (res) => {
        this.mensajeOk = res.mensaje;
        this.cargarTodo();
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al completar entrega.';
        this.cdr.detectChanges();
      }
    });
  }
}