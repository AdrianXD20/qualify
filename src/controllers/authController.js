const { db } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'qualify-secret-key-cambiar-en-produccion';
const JWT_EXPIRES_IN = '1h';

async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario por correo
    const { data: usuario, error } = await db
      .from('usuarios')
      .select('id, rol, nombre, correo, password, telefono')
      .eq('correo', correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, correo: usuario.correo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // No devolver el password hash
    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: usuarioSinPassword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function me(req, res) {
  try {
    const { data: usuario, error } = await db
      .from('usuarios')
      .select('id, rol, nombre, correo, telefono, creado_en')
      .eq('id', req.usuario.id)
      .single();

    if (error || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, me };
