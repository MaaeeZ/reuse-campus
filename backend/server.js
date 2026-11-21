const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { verificarUsuario } = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(express.json());

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { correo, password } = req.body;
    if (!correo || !password) return res.status(400).json({ error: 'Correo y contraseña obligatorios.' });

    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, correo, rol, estado FROM usuarios WHERE correo = ? AND password = ?',
            [correo, password]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas.' });
        if (rows[0].estado !== 'ACTIVO') return res.status(403).json({ error: 'Cuenta suspendida.' });

        res.json({ mensaje: 'Inicio de sesión exitoso', usuario: rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error interno en login.' });
    }
});

// PUBLICACIONES
app.get('/api/publicaciones', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, u.nombre AS propietarioNombre 
            FROM publicaciones p 
            JOIN usuarios u ON p.usuarioId = u.id 
            ORDER BY p.fechaPublicacion DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener publicaciones.' });
    }
});

app.post('/api/publicaciones', verificarUsuario, async (req, res) => {
    const { titulo, descripcion, categoria, modalidad } = req.body;
    if (!titulo || !descripcion || !categoria || !modalidad) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (!['DONACION', 'INTERCAMBIO'].includes(modalidad)) {
        return res.status(400).json({ error: 'Modalidad inválida.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO publicaciones (titulo, descripcion, categoria, modalidad, usuarioId) VALUES (?, ?, ?, ?, ?)',
            [titulo, descripcion, categoria, modalidad, req.usuario.id]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Publicación creada con éxito.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la publicación.' });
    }
});

app.put('/api/publicaciones/:id/cancelar', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    try {
        const [pubs] = await pool.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
        if (pubs.length === 0) return res.status(404).json({ error: 'Publicación no encontrada.' });

        const pub = pubs[0];
        if (pub.usuarioId !== req.usuario.id && req.usuario.rol !== 'Administrador') {
            return res.status(403).json({ error: 'No tienes permiso para cancelar esta publicación.' });
        }
        if (pub.estado !== 'DISPONIBLE') {
            return res.status(400).json({ error: 'Solo se pueden cancelar publicaciones DISPONIBLES.' });
        }

        await pool.query("UPDATE publicaciones SET estado = 'CANCELADA' WHERE id = ?", [id]);
        res.json({ mensaje: 'Publicación cancelada correctamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al cancelar publicación.' });
    }
});


// --- SOLICITUDES ---
app.get('/api/solicitudes', verificarUsuario, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, p.titulo AS publicacionTitulo, p.usuarioId AS propietarioId, u.nombre AS solicitanteNombre
            FROM solicitudes s
            JOIN publicaciones p ON s.publicacionId = p.id
            JOIN usuarios u ON s.solicitanteId = u.id
            ORDER BY s.fechaSolicitud DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al cargar solicitudes.' });
    }
});

app.post('/api/solicitudes', verificarUsuario, async (req, res) => {
    const { publicacionId, mensaje } = req.body;
    const solicitanteId = req.usuario.id;

    if (!publicacionId || !mensaje) {
        return res.status(400).json({ error: 'Publicación y mensaje son obligatorios.' });
    }

    try {
        const [pubs] = await pool.query('SELECT * FROM publicaciones WHERE id = ?', [publicacionId]);
        if (pubs.length === 0) return res.status(404).json({ error: 'La publicación no existe.' });

        const pub = pubs[0];
        if (pub.usuarioId === solicitanteId) {
            return res.status(400).json({ error: 'RN03: No puedes solicitar tu propia publicación.' });
        }
        if (pub.estado !== 'DISPONIBLE') {
            return res.status(400).json({ error: `No se puede solicitar: la publicación está ${pub.estado}.` });
        }

        const [duplicadas] = await pool.query(
            "SELECT id FROM solicitudes WHERE publicacionId = ? AND solicitanteId = ? AND estado = 'PENDIENTE'",
            [publicacionId, solicitanteId]
        );
        if (duplicadas.length > 0) {
            return res.status(400).json({ error: 'RN05: Ya tienes una solicitud PENDIENTE para este artículo.' });
        }

        const [result] = await pool.query(
            'INSERT INTO solicitudes (publicacionId, solicitanteId, mensaje) VALUES (?, ?, ?)',
            [publicacionId, solicitanteId, mensaje]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Solicitud enviada correctamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar solicitud.' });
    }
});

app.put('/api/solicitudes/:id/aceptar', verificarUsuario, async (req, res) => {
    const solicitudId = req.params.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [sols] = await conn.query(`
            SELECT s.*, p.usuarioId AS propietarioId, p.estado AS pubEstado 
            FROM solicitudes s 
            JOIN publicaciones p ON s.publicacionId = p.id 
            WHERE s.id = ? FOR UPDATE
        `, [solicitudId]);

        if (sols.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        const sol = sols[0];
        if (sol.propietarioId !== req.usuario.id) {
            await conn.rollback();
            return res.status(403).json({ error: 'RN07: Solo el propietario puede aceptar esta solicitud.' });
        }
        if (sol.estado !== 'PENDIENTE' || sol.pubEstado !== 'DISPONIBLE') {
            await conn.rollback();
            return res.status(400).json({ error: 'La solicitud o publicación ya no está disponible.' });
        }

        await conn.query("UPDATE solicitudes SET estado = 'ACEPTADA' WHERE id = ?", [solicitudId]);
        await conn.query(
            "UPDATE solicitudes SET estado = 'RECHAZADA' WHERE publicacionId = ? AND id != ? AND estado = 'PENDIENTE'",
            [sol.publicacionId, solicitudId]
        );
        await conn.query("UPDATE publicaciones SET estado = 'RESERVADA' WHERE id = ?", [sol.publicacionId]);
        await conn.query(
            'INSERT INTO entregas_intercambios (publicacionId, solicitudId, propietarioId, receptorId) VALUES (?, ?, ?, ?)',
            [sol.publicacionId, solicitudId, sol.propietarioId, sol.solicitanteId]
        );

        await conn.commit();
        res.json({ mensaje: 'Solicitud aceptada. Publicación RESERVADA y entrega generada.' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: 'Error al aceptar la solicitud.' });
    } finally {
        conn.release();
    }
});

app.put('/api/solicitudes/:id/rechazar', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    try {
        const [sols] = await pool.query(`
            SELECT s.*, p.usuarioId AS propietarioId 
            FROM solicitudes s JOIN publicaciones p ON s.publicacionId = p.id 
            WHERE s.id = ?
        `, [id]);

        if (sols.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
        if (sols[0].propietarioId !== req.usuario.id) {
            return res.status(403).json({ error: 'RN07: Solo el propietario puede rechazar.' });
        }
        if (sols[0].estado !== 'PENDIENTE') {
            return res.status(400).json({ error: 'Solo se pueden rechazar solicitudes PENDIENTES.' });
        }

        await pool.query("UPDATE solicitudes SET estado = 'RECHAZADA' WHERE id = ?", [id]);
        res.json({ mensaje: 'Solicitud rechazada.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al rechazar solicitud.' });
    }
});

app.put('/api/solicitudes/:id/cancelar', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    try {
        const [sols] = await pool.query('SELECT * FROM solicitudes WHERE id = ?', [id]);
        if (sols.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
        if (sols[0].solicitanteId !== req.usuario.id) {
            return res.status(403).json({ error: 'Solo el solicitante puede cancelar su solicitud.' });
        }
        if (sols[0].estado !== 'PENDIENTE') {
            return res.status(400).json({ error: 'RN16: Solo puedes cancelar solicitudes en estado PENDIENTE.' });
        }

        await pool.query("UPDATE solicitudes SET estado = 'CANCELADA' WHERE id = ?", [id]);
        res.json({ mensaje: 'Solicitud cancelada.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al cancelar solicitud.' });
    }
});

// --- ENTREGAS ---
app.get('/api/entregas', verificarUsuario, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, p.titulo AS publicacionTitulo, p.modalidad,
                   up.nombre AS propietarioNombre, ur.nombre AS receptorNombre
            FROM entregas_intercambios e
            JOIN publicaciones p ON e.publicacionId = p.id
            JOIN usuarios up ON e.propietarioId = up.id
            JOIN usuarios ur ON e.receptorId = ur.id
            ORDER BY e.fechaAcuerdo DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al listar entregas.' });
    }
});

app.put('/api/entregas/:id/completar', verificarUsuario, async (req, res) => {
    const entregaId = req.params.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [entregas] = await conn.query(
            'SELECT e.*, p.estado AS pubEstado FROM entregas_intercambios e JOIN publicaciones p ON e.publicacionId = p.id WHERE e.id = ? FOR UPDATE',
            [entregaId]
        );

        if (entregas.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Registro de entrega no encontrado.' });
        }

        const ent = entregas[0];
        if (ent.propietarioId !== req.usuario.id && ent.receptorId !== req.usuario.id) {
            await conn.rollback();
            return res.status(403).json({ error: 'No participas en este intercambio.' });
        }
        if (ent.pubEstado !== 'RESERVADA' || ent.estado !== 'PENDIENTE') {
            await conn.rollback();
            return res.status(400).json({ error: 'RN13: La publicación debe estar RESERVADA y la entrega PENDIENTE.' });
        }

        await conn.query("UPDATE entregas_intercambios SET estado = 'COMPLETADA', fechaEntrega = NOW() WHERE id = ?", [entregaId]);
        await conn.query("UPDATE publicaciones SET estado = 'ENTREGADA' WHERE id = ?", [ent.publicacionId]);

        await conn.commit();
        res.json({ mensaje: 'Entrega confirmada. La publicación ahora figura como ENTREGADA.' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: 'Error al confirmar entrega.' });
    } finally {
        conn.release();
    }
});

// --- ADMIN USUARIOS ---
app.get('/api/usuarios', verificarUsuario, async (req, res) => {
    if (req.usuario.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Acceso exclusivo para Administradores.' });
    }
    const [rows] = await pool.query('SELECT id, nombre, correo, rol, estado FROM usuarios');
    res.json(rows);
});

app.put('/api/usuarios/:id/estado', verificarUsuario, async (req, res) => {
    if (req.usuario.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Acceso exclusivo para Administradores.' });
    }
    const { estado } = req.body;
    await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ mensaje: 'Estado de usuario actualizado.' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor ReUse Campus corriendo en puerto ${PORT}`));