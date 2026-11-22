const { supabase } = require('../config/supabase');
const { esquemaUsuario } = require('../models/Usuario');

async function listar(req, res) {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaUsuario.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { data, error: dbError } = await supabase
    .from('usuarios')
    .insert([req.body])
    .select()
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
