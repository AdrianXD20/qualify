const { db } = require('../config/supabase');
const { esquemaServicio } = require('../models/Servicio');
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

  let query = db.from('servicios').select('*, abuelos(nombre), cuidadores(id)');
  if (permitidos !== null) query = query.in('abuelo_id', permitidos);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('servicios')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Servicio no encontrado' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, data.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este servicio' });
  }

  res.json(data);
}

async function crear(req, res) {
  if (req.usuario.rol !== 'familiar' && !esAdmin(req.usuario)) {
    return res.status(403).json({ error: 'Solo un familiar puede contratar servicios' });
  }

  const { error } = esquemaServicio.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, req.body.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  // Verificar que el cuidador esté verificado antes de crear el servicio
  const { data: cuidador } = await db
    .from('cuidadores')
    .select('verificado')
    .eq('id', req.body.cuidador_id)
    .single();

  if (!cuidador || !cuidador.verificado) {
    return res.status(403).json({ error: 'El cuidador no está verificado para prestar servicios' });
  }

  const { data, error: dbError } = await db
    .from('servicios')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: servicio } = await db
    .from('servicios')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, servicio.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este servicio' });
  }

  const cambios = soloCampos(req.body, [
    'nota', 'inicio', 'fin', 'tarifa_hora', 'total', 'comision', 'estado', 'estado_pago',
  ]);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('servicios')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: servicio } = await db
    .from('servicios')
    .select('id, abuelo_id, abuelos(familiar_id)')
    .eq('id', req.params.id)
    .single();

  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const familiarId = servicio.abuelos && servicio.abuelos.familiar_id;
  if (!esAdmin(req.usuario) && !igual(familiarId, req.usuario.id)) {
    return res.status(403).json({ error: 'Solo el familiar puede eliminar el servicio' });
  }

  const { error } = await db.from('servicios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Servicio eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
