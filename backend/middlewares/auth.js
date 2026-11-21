const pool = require('../db');

async function verificarUsuario(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'No autenticado. Debes iniciar sesión.' });
    }
    try {
        const [rows] = await pool.query('SELECT id, nombre, correo, rol, estado FROM usuarios WHERE id = ?', [userId]);
        if (rows.length === 0 || rows[0].estado !== 'ACTIVO') {
            return res.status(403).json({ error: 'Usuario inválido o inactivo.' });
        }
        req.usuario = rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar sesión.' });
    }
}

module.exports = { verificarUsuario };