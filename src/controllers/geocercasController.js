const { db } = require('../config/supabase');
const { esquemaGeocerca } = require('../models/Geocerca');
const { abuelosPermitidos, permiteAbuelo, soloCampos } = require('../utils/acceso');

async function listar(req, res) {
  const permitidos = await abuelosPermitidos(req.usuario);
  if (permitidos !== null && permitidos.length === 0) return res.json([]);

  let query = db.from('geocercas').select('*');
  if (permitidos !== null) query = query.in('abuelo_id', permitidos);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('geocercas')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Geocerca no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, data.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta geocerca' });
  }

  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaGeocerca.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, req.body.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  const { data, error: dbError } = await db
    .from('geocercas')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: geocerca } = await db
    .from('geocercas')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!geocerca) return res.status(404).json({ error: 'Geocerca no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, geocerca.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta geocerca' });
  }

  const cambios = soloCampos(req.body, [
    'nombre',
    'latitud',
    'longitud',
    'radio_metros',
    'activo',
    'calle_numero',
    'colonia',
    'codigo_postal',
    'ciudad',
    'estado',
    'pais',
    'direccion_formateada',
  ]);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('geocercas')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: geocerca } = await db
    .from('geocercas')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!geocerca) return res.status(404).json({ error: 'Geocerca no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, geocerca.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta geocerca' });
  }

  const { error } = await db.from('geocercas').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Geocerca eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
