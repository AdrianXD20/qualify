const { db } = require('../config/supabase');
const { esquemaUsuario } = require('../models/Usuario');
const { esAdmin, igual, soloCampos } = require('../utils/acceso');
const bcrypt = require('bcryptjs');

async function listar(req, res) {
  let query = db
    .from('usuarios')
    .select('id, rol, nombre, correo, telefono, creado_en');

  // Cada usuario solo ve su propia cuenta; el admin ve todas.
  if (!esAdmin(req.usuario)) query = query.eq('id', req.usuario.id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  if (!esAdmin(req.usuario) && !igual(req.usuario.id, req.params.id)) {
    return res.status(403).json({ error: 'No puedes consultar otro usuario' });
  }

  const { data, error } = await db
    .from('usuarios')
    .select('id, rol, nombre, correo, telefono, creado_en')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaUsuario.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Hashear la contraseña antes de guardarla
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(req.body.password, salt);

  const { data, error: dbError } = await db
    .from('usuarios')
    .insert([{
      ...req.body,
      password: passwordHash
    }])
    .select('id, rol, nombre, correo, telefono, creado_en')
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  if (!esAdmin(req.usuario) && !igual(req.usuario.id, req.params.id)) {
    return res.status(403).json({ error: 'No puedes modificar otro usuario' });
  }

  // Nunca permitir cambiar el hash de contraseña ni el rol desde aquí.
  const camposPermitidos = esAdmin(req.usuario)
    ? ['nombre', 'correo', 'telefono', 'rol']
    : ['nombre', 'correo', 'telefono'];
  const cambios = soloCampos(req.body, camposPermitidos);

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('usuarios')
    .update(cambios)
    .eq('id', req.params.id)
    .select('id, rol, nombre, correo, telefono, creado_en')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
}

async function eliminar(req, res) {
  if (!esAdmin(req.usuario) && !igual(req.usuario.id, req.params.id)) {
    return res.status(403).json({ error: 'No puedes eliminar otro usuario' });
  }

  const { error } = await db.from('usuarios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Usuario eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
