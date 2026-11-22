const { supabase } = require('../config/supabase');
const { esquemaCuidador } = require('../models/Cuidador');

async function listar(req, res) {
  const { data, error } = await supabase.from('cuidadores').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await supabase
    .from('cuidadores')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Cuidador no encontrado' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaCuidador.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { data, error: dbError } = await supabase
    .from('cuidadores')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data, error } = await supabase
    .from('cuidadores')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Cuidador no encontrado' });
  res.json(data);
}

async function eliminar(req, res) {
  const { error } = await supabase.from('cuidadores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Cuidador eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
