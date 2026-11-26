# ReUse Campus – Plataforma de Reutilización e Intercambio (IPVG)

Plataforma web de economía circular desarrollada para la comunidad educativa del Instituto Profesional Virginio Gómez (Sede Chillán). Permite que los integrantes publiquen artículos académicos que ya no utilizan (libros, componentes electrónicos, calculadoras, materiales) bajo modalidad de donación o intercambio, gestionen solicitudes de otros estudiantes y controlen de forma trazable todo el ciclo de vida hasta la confirmación de entrega.

## Autores
- Josefa Lagos
- Maximiliano Mendoza

## Tecnologías Utilizadas
- **Frontend:** Angular (Standalone Components, TypeScript, HttpClient, Router, CSS3).
- **Backend:** Node.js con Express.js (API REST).
- **Base de Datos:** MySQL 8.0+ (conector `mysql2/promise` con soporte de transacciones ACID).
- **Control de Versiones:** Git y GitHub.

## Requisitos Previos
- **Node.js:** v18.0 o superior.
- **Angular CLI:** v17.0 o superior.
- **Servidor MySQL:** MySQL Server 8.0+ y MySQL Workbench (o entorno equivalente como XAMPP/Laragon).

## Configuración de la Base de Datos
1. Abrir **MySQL Workbench** e iniciar sesión en la instancia local (`localhost:3306`).
2. Abrir el archivo `backend/database.sql` del proyecto.
3. Ejecutar todo el script SQL. Esto creará automáticamente:
   - La base de datos `reuse_campus`.
   - Las 4 tablas relacionadas con sus claves primarias y foráneas: `usuarios`, `publicaciones`, `solicitudes` y `entregas_intercambios`.
   - Cuatro cuentas de usuario iniciales para pruebas (1 Administrador y 3 Usuarios).
4. Si tu servidor MySQL local utiliza contraseña para el usuario `root`, editar el archivo `backend/db.js` y colocarla en el campo `password`.

## Instalación y Ejecución

### 1. Levantar el Backend (Express)
Abrir una terminal en la raíz del proyecto y ejecutar:
```bash
cd backend
npm install
node server.js
```
El servidor API quedará escuchando en `http://localhost:3000`.

### 2. Levantar el Frontend (Angular)
Abrir una segunda terminal en la raíz del proyecto y ejecutar:
```bash
cd frontend
npm install
ng serve
```
Abrir el navegador web en `http://localhost:4200`.

## Estructura General de la Solución
```text
reuse-campus/
├── backend/
│   ├── middlewares/
│   │   └── auth.js          # Validación de sesión activa y roles en servidor (RN01, RN18)
│   ├── database.sql         # Script DDL de creación de tablas, relaciones y datos semilla
│   ├── db.js                # Configuración del pool de conexiones a MySQL
│   ├── package.json         # Dependencias del servidor Node/Express
│   └── server.js            # Endpoints REST y lógica de reglas de negocio (RN01–RN18)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── admin/       # Gestión de estado de usuarios (Rol Administrador)
│       │   │   ├── catalogo/    # Listado, publicación y solicitud de artículos
│       │   │   ├── gestiones/   # Aceptación/rechazo de solicitudes y cierre de entregas
│       │   │   └── login/       # Inicio de sesión y acceso rápido de prueba
│       │   ├── models/
│       │   │   └── interfaces.ts # Tipado fuerte de las 4 entidades del dominio
│       │   ├── services/
│       │   │   └── api.service.ts # Consumo de API REST mediante HttpClient
│       │   ├── app.config.ts    # Configuración de rutas y proveedor HttpClient
│       │   ├── app.routes.ts    # Definición de rutas de navegación
│       │   └── app.ts           # Componente raíz y barra de navegación dinámica
│       └── styles.css           # Estilos globales, tarjetas, tablas y badges de estado
└── README.md
```

## Funcionalidades Implementadas
- **Autenticación y Control de Roles:** Inicio de sesión con validación en backend mediante cabecera `x-user-id` y vistas diferenciadas para `Usuario` y `Administrador` (RN01, RN18).
- **Gestión de Publicaciones:** Creación de artículos en estado `DISPONIBLE` bajo modalidad `DONACION` o `INTERCAMBIO`, y cancelación lógica (`CANCELADA`) respetando el historial (RN02, RN17).
- **Gestión de Solicitudes:** Envío de solicitudes sobre artículos disponibles, impidiendo que el propietario solicite su propio artículo (RN03), que un usuario duplique solicitudes pendientes (RN05) o que se soliciten artículos no disponibles (RN04, RN12, RN15). Permite al solicitante cancelar mientras esté `PENDIENTE` (RN16).
- **Aceptación en Cascada y Trazabilidad de Entregas:** Al aceptar una solicitud mediante transacción SQL (`BEGIN TRANSACTION` / `COMMIT`), la solicitud pasa a `ACEPTADA`, las demás solicitudes pendientes de esa publicación pasan automáticamente a `RECHAZADA`, la publicación cambia a `RESERVADA` y se crea un registro en `entregas_intercambios` en estado `PENDIENTE` (RN07–RN11).
- **Cierre de Entrega:** Confirmación de entrega física (`COMPLETADA`), actualizando automáticamente la publicación a estado final `ENTREGADA` (RN13, RN14).

## Pruebas Realizadas
1. **Demostración del Flujo Funcional Completo:**
   - **Carlos (`carlos@ipvg.cl`)** publica un artículo (queda en estado `DISPONIBLE`).
   - **Ana (`ana@ipvg.cl`)** y **Luis (`luis@ipvg.cl`)** envían solicitudes sobre dicha publicación (ambas quedan en estado `PENDIENTE`).
   - **Carlos** acepta la solicitud de Ana: la publicación pasa automáticamente a `RESERVADA`, la solicitud de Luis pasa a `RECHAZADA` y se genera una Entrega/Intercambio en estado `PENDIENTE`.
   - **Carlos** confirma la entrega física: la entrega pasa a `COMPLETADA` con fecha registrada y la publicación cambia a `ENTREGADA`.
2. **Pruebas de Reglas de Negocio y Manejo de Errores:**
   - Intento de solicitar una publicación propia (rechazado por backend con HTTP 400 – RN03).
   - Intento de enviar dos solicitudes pendientes al mismo artículo por el mismo usuario (rechazado con HTTP 400 – RN05).
   - Intento de solicitar publicaciones en estado `RESERVADA`, `ENTREGADA` o `CANCELADA` (rechazado con HTTP 400 – RN04/RN12/RN15).
   - Manejo de errores de red y visualización de alertas comprensibles en la interfaz Angular.
3. **Verificación de Persistencia:** Recarga del navegador y reinicio del servidor Express verificando que todos los registros y estados permanecen persistidos correctamente en MySQL.

## Declaración de Uso de Inteligencia Artificial
- **Herramienta utilizada:** Gemini (Google).
- **Tareas concretas en las que se utilizó IA:** Apoyo en el diseño del esquema relacional SQL, estructuración de las transacciones atómicas en Node.js/Express (`beginTransaction`, `commit`, `rollback`) para garantizar integridad en las reglas RN08–RN11, y generación de plantillas base de componentes standalone en Angular.
- **Partes generadas con IA y modificaciones realizadas por los estudiantes:** Se utilizaron como base las estructuras propuestas para los controladores REST, el servicio `ApiService` y las vistas HTML/CSS. Posteriormente, los estudiantes adaptaron los nombres de columnas y estados según los requisitos exactos de la pauta IPVG, configuraron los usuarios de prueba locales, ajustaron el manejo de sesión mediante cabecera `x-user-id` y corrigieron detalles de enrutamiento y estilos.
- **Verificación de funcionamiento:** Se ejecutó la aplicación de extremo a extremo probando cada caso de éxito y cada situación inválida tanto desde la interfaz gráfica en Angular como inspeccionando directamente las tablas en MySQL Workbench para confirmar el cumplimiento de las 18 reglas de negocio.
