const { supabase } = require('../config/supabase');
const { esquemaUsuario } = require('../models/Usuario');
const bcrypt = require('bcryptjs');

async function listar(req, res) {
  const { data, error } = await supabase.from('usuarios').select('id, rol, nombre, correo, telefono, creado_en');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await supabase
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

  const { data, error: dbError } = await supabase
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
  const { data, error } = await supabase
    .from('usuarios')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
}

async function eliminar(req, res) {
  const { error } = await supabase.from('usuarios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Usuario eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
