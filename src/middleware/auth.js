const { supabase } = require('../config/supabase');

async function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.usuario = data.user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar autenticación' });
  }
}

module.exports = { autenticar };
