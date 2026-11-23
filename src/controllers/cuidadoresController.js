const { db } = require('../config/supabase');
const { esquemaCuidador } = require('../models/Cuidador');
const { esAdmin, igual, soloCampos } = require('../utils/acceso');

async function listar(req, res) {
  const { data, error } = await db.from('cuidadores').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
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

  // El registro público no permite autoasignarse "verificado".
  const cuerpo = { ...req.body };
  if (!esAdmin(req.usuario)) cuerpo.verificado = false;

  const { data, error: dbError } = await db
    .from('cuidadores')
    .insert([cuerpo])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: cuidador } = await db
    .from('cuidadores')
    .select('id, usuario_id')
    .eq('id', req.params.id)
    .single();

  if (!cuidador) return res.status(404).json({ error: 'Cuidador no encontrado' });
  if (!esAdmin(req.usuario) && !igual(cuidador.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes modificar este cuidador' });
  }

  const camposPermitidos = esAdmin(req.usuario)
    ? ['cedula', 'titulo', 'rfc', 'verificado', 'descripcion', 'anios_experiencia', 'tarifa_hora', 'especialidades']
    : ['cedula', 'titulo', 'rfc', 'descripcion', 'anios_experiencia', 'tarifa_hora', 'especialidades'];
  const cambios = soloCampos(req.body, camposPermitidos);

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('cuidadores')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: cuidador } = await db
    .from('cuidadores')
    .select('id, usuario_id')
    .eq('id', req.params.id)
    .single();

  if (!cuidador) return res.status(404).json({ error: 'Cuidador no encontrado' });
  if (!esAdmin(req.usuario) && !igual(cuidador.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes eliminar este cuidador' });
  }

  const { error } = await db.from('cuidadores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Cuidador eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
