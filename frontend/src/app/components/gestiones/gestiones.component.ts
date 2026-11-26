import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Solicitud, EntregaIntercambio } from '../../models/interfaces';

@Component({
  selector: 'app-gestiones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Gestión de Solicitudes y Entregas</h2>

    <div *ngIf="mensajeOk" class="alert-success">{{ mensajeOk }}</div>
    <div *ngIf="mensajeError" class="alert-error">{{ mensajeError }}</div>

    <!-- SECCIÓN 1: SOLICITUDES RECIBIDAS -->
    <section class="card">
      <h3>1. Solicitudes Recibidas (Como Propietario)</h3>
      <p *ngIf="solicitudesRecibidas.length === 0">No has recibido solicitudes aún.</p>
      <table *ngIf="solicitudesRecibidas.length > 0">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Solicitante</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of solicitudesRecibidas">
            <td>{{ s.publicacionTitulo }}</td>
            <td>{{ s.solicitanteNombre }}</td>
            <td>{{ s.mensaje }}</td>
            <td><span class="badge" [ngClass]="s.estado.toLowerCase()">{{ s.estado }}</span></td>
            <td>
              <ng-container *ngIf="s.estado === 'PENDIENTE'">
                <button (click)="aceptar(s.id)" class="btn-success">Aceptar</button>
                <button (click)="rechazar(s.id)" class="btn-danger">Rechazar</button>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SECCIÓN 2: MIS SOLICITUDES ENVIADAS -->
    <section class="card">
      <h3>2. Mis Solicitudes Enviadas</h3>
      <p *ngIf="solicitudesEnviadas.length === 0">No has enviado solicitudes.</p>
      <table *ngIf="solicitudesEnviadas.length > 0">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of solicitudesEnviadas">
            <td>{{ s.publicacionTitulo }}</td>
            <td>{{ s.mensaje }}</td>
            <td><span class="badge" [ngClass]="s.estado.toLowerCase()">{{ s.estado }}</span></td>
            <td>
              <button *ngIf="s.estado === 'PENDIENTE'" (click)="cancelarSol(s.id)" class="btn-danger">
                Cancelar Solicitud
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SECCIÓN 3: ENTREGAS E INTERCAMBIOS -->
    <section class="card">
      <h3>3. Entregas e Intercambios Acordados</h3>
      <p *ngIf="misEntregas.length === 0">No tienes entregas registradas.</p>
      <table *ngIf="misEntregas.length > 0">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Modalidad</th>
            <th>Propietario</th>
            <th>Receptor</th>
            <th>Estado</th>
            <th>Confirmación</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of misEntregas">
            <td>{{ e.publicacionTitulo }}</td>
            <td>{{ e.modalidad }}</td>
            <td>{{ e.propietarioNombre }}</td>
            <td>{{ e.receptorNombre }}</td>
            <td><span class="badge" [ngClass]="e.estado.toLowerCase()">{{ e.estado }}</span></td>
            <td>
              <button *ngIf="e.estado === 'PENDIENTE'" (click)="completar(e.id)" class="btn-primary">
                Confirmar Entrega Completada
              </button>
              <span *ngIf="e.estado === 'COMPLETADA'">Finalizado el {{ e.fechaEntrega | date:'short' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `
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