const { supabase } = require('../config/supabase');
const { esquemaGeocerca } = require('../models/Geocerca');

async function listar(req, res) {
  const { data, error } = await supabase.from('geocercas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await supabase
    .from('geocercas')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Geocerca no encontrada' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaGeocerca.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { data, error: dbError } = await supabase
    .from('geocercas')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data, error } = await supabase
    .from('geocercas')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Geocerca no encontrada' });
  res.json(data);
}

async function eliminar(req, res) {
  const { error } = await supabase.from('geocercas').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Geocerca eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
