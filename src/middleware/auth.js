const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'qualify-secret-key-cambiar-en-produccion';

async function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = {
      id: decoded.id,
      rol: decoded.rol,
      correo: decoded.correo,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo un administrador puede realizar esta acción' });
  }
  next();
}

// Reutilizado por Socket.io para autenticar el handshake con el mismo JWT.
function verificarToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  return { id: decoded.id, rol: decoded.rol, correo: decoded.correo };
}

module.exports = { autenticar, soloAdmin, verificarToken };
