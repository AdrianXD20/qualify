const { db } = require('../config/supabase');
const { esquemaAbuelo } = require('../models/Abuelo');
const {
  esAdmin,
  igual,
  abuelosPermitidos,
  permiteAbuelo,
  soloCampos,
} = require('../utils/acceso');

async function listar(req, res) {
  const permitidos = await abuelosPermitidos(req.usuario);
  if (permitidos !== null && permitidos.length === 0) return res.json([]);

  let query = db.from('abuelos').select('*');
  if (permitidos !== null) query = query.in('id', permitidos);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('abuelos')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Abuelo no encontrado' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, data.id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  res.json(data);
}

async function crear(req, res) {
  if (req.usuario.rol !== 'familiar' && !esAdmin(req.usuario)) {
    return res.status(403).json({ error: 'Solo un familiar puede registrar abuelos' });
  }

  // El familiar solo puede registrar abuelos a su propio nombre.
  const cuerpo = { ...req.body };
  if (!esAdmin(req.usuario)) cuerpo.familiar_id = req.usuario.id;

  const { error } = esquemaAbuelo.validate(cuerpo);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { data, error: dbError } = await db
    .from('abuelos')
    .insert([cuerpo])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: abuelo } = await db
    .from('abuelos')
    .select('id, familiar_id')
    .eq('id', req.params.id)
    .single();

  if (!abuelo) return res.status(404).json({ error: 'Abuelo no encontrado' });
  if (!esAdmin(req.usuario) && !igual(abuelo.familiar_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes modificar este abuelo' });
  }

  const cambios = soloCampos(req.body, ['nombre', 'nacimiento', 'condiciones', 'notas']);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('abuelos')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: abuelo } = await db
    .from('abuelos')
    .select('id, familiar_id')
    .eq('id', req.params.id)
    .single();

  if (!abuelo) return res.status(404).json({ error: 'Abuelo no encontrado' });
  if (!esAdmin(req.usuario) && !igual(abuelo.familiar_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes eliminar este abuelo' });
  }

  const { error } = await db.from('abuelos').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Abuelo eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
