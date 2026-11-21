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

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor ReUse Campus corriendo en puerto ${PORT}`));