export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'Usuario' | 'Administrador';
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: 'DONACION' | 'INTERCAMBIO';
  estado: 'DISPONIBLE' | 'RESERVADA' | 'ENTREGADA' | 'CANCELADA';
  fechaPublicacion: string;
  usuarioId: number;
  propietarioNombre?: string;
}

export interface Solicitud {
  id: number;
  publicacionId: number;
  solicitanteId: number;
  mensaje: string;
  fechaSolicitud: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
  publicacionTitulo?: string;
  propietarioId?: number;
  solicitanteNombre?: string;
}

export interface EntregaIntercambio {
  id: number;
  publicacionId: number;
  solicitudId: number;
  propietarioId: number;
  receptorId: number;
  fechaAcuerdo: string;
  fechaEntrega?: string;
  estado: 'PENDIENTE' | 'COMPLETADA';
  publicacionTitulo?: string;
  modalidad?: string;
  propietarioNombre?: string;
  receptorNombre?: string;
}