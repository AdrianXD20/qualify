const { db } = require('../config/supabase');
const { esquemaMedicina } = require('../models/Medicina');
const { abuelosPermitidos, permiteAbuelo, soloCampos } = require('../utils/acceso');

async function listar(req, res) {
  const permitidos = await abuelosPermitidos(req.usuario);
  if (permitidos !== null && permitidos.length === 0) return res.json([]);

  let query = db.from('medicinas').select('*');
  if (permitidos !== null) query = query.in('abuelo_id', permitidos);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('medicinas')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Medicina no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, data.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta medicina' });
  }

  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaMedicina.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, req.body.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  const { data, error: dbError } = await db
    .from('medicinas')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: medicina } = await db
    .from('medicinas')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!medicina) return res.status(404).json({ error: 'Medicina no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, medicina.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta medicina' });
  }

  const cambios = soloCampos(req.body, ['nombre', 'dosis', 'horario']);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('medicinas')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: medicina } = await db
    .from('medicinas')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!medicina) return res.status(404).json({ error: 'Medicina no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, medicina.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta medicina' });
  }

  const { error } = await db.from('medicinas').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Medicina eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
