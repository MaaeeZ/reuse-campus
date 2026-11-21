CREATE DATABASE IF NOT EXISTS reuse_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reuse_campus;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Usuario', 'Administrador') NOT NULL DEFAULT 'Usuario',
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    modalidad ENUM('DONACION', 'INTERCAMBIO') NOT NULL,
    estado ENUM('DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA') NOT NULL DEFAULT 'DISPONIBLE',
    fechaPublicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuarioId INT NOT NULL,
    CONSTRAINT fk_pub_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
);

CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacionId INT NOT NULL,
    solicitanteId INT NOT NULL,
    mensaje TEXT NOT NULL,
    fechaSolicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT fk_sol_publicacion FOREIGN KEY (publicacionId) REFERENCES publicaciones(id),
    CONSTRAINT fk_sol_usuario FOREIGN KEY (solicitanteId) REFERENCES usuarios(id)
);

CREATE TABLE entregas_intercambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacionId INT NOT NULL,
    solicitudId INT NOT NULL UNIQUE,
    propietarioId INT NOT NULL,
    receptorId INT NOT NULL,
    fechaAcuerdo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaEntrega DATETIME NULL,
    estado ENUM('PENDIENTE', 'COMPLETADA') NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT fk_ent_publicacion FOREIGN KEY (publicacionId) REFERENCES publicaciones(id),
    CONSTRAINT fk_ent_solicitud FOREIGN KEY (solicitudId) REFERENCES solicitudes(id),
    CONSTRAINT fk_ent_propietario FOREIGN KEY (propietarioId) REFERENCES usuarios(id),
    CONSTRAINT fk_ent_receptor FOREIGN KEY (receptorId) REFERENCES usuarios(id)
);

INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES
('Admin IPVG', 'admin@ipvg.cl', '123456', 'Administrador', 'ACTIVO'),
('Carlos Propietario', 'carlos@ipvg.cl', '123456', 'Usuario', 'ACTIVO'),
('Ana Solicitante', 'ana@ipvg.cl', '123456', 'Usuario', 'ACTIVO'),
('Luis Interesado', 'luis@ipvg.cl', '123456', 'Usuario', 'ACTIVO');