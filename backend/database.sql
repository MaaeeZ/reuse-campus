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

INSERT INTO publicaciones (
    titulo,
    descripcion,
    categoria,
    modalidad,
    estado,
    fechaPublicacion,
    usuarioId
) VALUES
(
    'Libro Fundamentos de Bases de Datos',
    'Texto impreso en buen estado, ideal para asignaturas de modelamiento relacional y SQL. Sin rayaduras importantes.',
    'Libros y Apuntes',
    'DONACION',
    'DISPONIBLE',
    '2026-11-20 10:15:00',
    2
),
(
    'Calculadora Científica Casio fx-82MS',
    'Funciona perfectamente con pila nueva. La entrego con su tapa rígida protectora para clases o certámenes.',
    'Electrónica',
    'INTERCAMBIO',
    'DISPONIBLE',
    '2026-11-21 14:30:00',
    2
),
(
    'Mouse Inalámbrico Logitech M170',
    'Mouse óptico compacto con receptor USB, ideal para llevar en el bolso al laboratorio o biblioteca.',
    'Periféricos',
    'DONACION',
    'DISPONIBLE',
    '2026-11-22 09:05:00',
    3
),
(
    'Apuntes Empastados de Redes y Comunicaciones',
    'Guías de ejercicios, resumen de modelos OSI/TCP-IP y apuntes de subnetting del semestre pasado.',
    'Libros y Apuntes',
    'DONACION',
    'DISPONIBLE',
    '2026-11-23 16:40:00',
    4
),
(
    'Hub USB 3.0 de 4 Puertos',
    'Adaptador metálico compacto para notebooks con pocos puertos. Lo intercambio por un cable HDMI o cuaderno universitario.',
    'Electrónica',
    'INTERCAMBIO',
    'DISPONIBLE',
    '2026-11-24 11:20:00',
    3
),
(
    'Mochila Urbana Negra Impermeable',
    'Compartimento acolchado para notebook de hasta 15.6 pulgadas y bolsillos laterales. Tiene leve desgaste en una costura.',
    'Accesorios',
    'DONACION',
    'RESERVADA',
    '2026-11-18 17:50:00',
    2
),
(
    'Teclado Mecánico Compacto 60%',
    'Switches táctiles en buen estado, incluye cable USB-C trenzado. Marcado como entregado tras coordinación en campus.',
    'Periféricos',
    'INTERCAMBIO',
    'ENTREGADA',
    '2026-11-15 13:10:00',
    4
),
(
    'Set de Destornilladores de Precisión',
    'Kit de 24 puntas para mantención de notebooks y consolas. Publicación cancelada por cambio de planes.',
    'Herramientas',
    'DONACION',
    'CANCELADA',
    '2026-11-19 08:45:00',
    1
);