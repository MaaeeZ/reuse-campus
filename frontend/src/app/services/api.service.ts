import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Usuario, Publicacion, Solicitud, EntregaIntercambio } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioGuardado());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  private obtenerUsuarioGuardado(): Usuario | null {
    const data = localStorage.getItem('reuse_user');
    return data ? JSON.parse(data) : null;
  }

  get usuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  private getHeaders(): HttpHeaders {
    const user = this.usuarioActual;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(user ? { 'x-user-id': user.id.toString() } : {})
    });
  }

  login(correo: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { correo, password }).pipe(
      tap(res => {
        localStorage.setItem('reuse_user', JSON.stringify(res.usuario));
        this.usuarioSubject.next(res.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('reuse_user');
    this.usuarioSubject.next(null);
  }

  getPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones`);
  }

  crearPublicacion(data: Partial<Publicacion>): Observable<any> {
    return this.http.post(`${this.apiUrl}/publicaciones`, data, { headers: this.getHeaders() });
  }

  cancelarPublicacion(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/publicaciones/${id}/cancelar`, {}, { headers: this.getHeaders() });
  }

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes`, { headers: this.getHeaders() });
  }

  crearSolicitud(publicacionId: number, mensaje: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes`, { publicacionId, mensaje }, { headers: this.getHeaders() });
  }

  aceptarSolicitud(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes/${id}/aceptar`, {}, { headers: this.getHeaders() });
  }

  rechazarSolicitud(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes/${id}/rechazar`, {}, { headers: this.getHeaders() });
  }

  cancelarSolicitud(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes/${id}/cancelar`, {}, { headers: this.getHeaders() });
  }

  getEntregas(): Observable<EntregaIntercambio[]> {
    return this.http.get<EntregaIntercambio[]>(`${this.apiUrl}/entregas`, { headers: this.getHeaders() });
  }

  completarEntrega(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/entregas/${id}/completar`, {}, { headers: this.getHeaders() });
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() });
  }

  cambiarEstadoUsuario(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/estado`, { estado }, { headers: this.getHeaders() });
  }
}