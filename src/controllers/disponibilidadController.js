const { db } = require('../config/supabase');
const { esquemaDisponibilidad } = require('../models/Disponibilidad');
const { esAdmin, igual, idsCuidadoresDe, soloCampos } = require('../utils/acceso');

async function listar(req, res) {
  const { data, error } = await db.from('disponibilidad').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('disponibilidad')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Disponibilidad no encontrada' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaDisponibilidad.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Un cuidador solo puede registrar su propia disponibilidad.
  if (!esAdmin(req.usuario)) {
    if (req.usuario.rol !== 'cuidador') {
      return res.status(403).json({ error: 'Solo un cuidador puede registrar disponibilidad' });
    }
    const cuidadores = await idsCuidadoresDe(req.usuario.id);
    if (!cuidadores.some((id) => igual(id, req.body.cuidador_id))) {
      return res.status(403).json({ error: 'El cuidador no corresponde a tu usuario' });
    }
  }

  const { data, error: dbError } = await db
    .from('disponibilidad')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data: disponibilidad } = await db
    .from('disponibilidad')
    .select('id, cuidador_id')
    .eq('id', req.params.id)
    .single();

  if (!disponibilidad) return res.status(404).json({ error: 'Disponibilidad no encontrada' });

  if (!esAdmin(req.usuario)) {
    const cuidadores = await idsCuidadoresDe(req.usuario.id);
    if (!cuidadores.some((id) => igual(id, disponibilidad.cuidador_id))) {
      return res.status(403).json({ error: 'No puedes modificar esta disponibilidad' });
    }
  }

  const cambios = soloCampos(req.body, ['dia_semana', 'hora_inicio', 'hora_fin']);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('disponibilidad')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: disponibilidad } = await db
    .from('disponibilidad')
    .select('id, cuidador_id')
    .eq('id', req.params.id)
    .single();

  if (!disponibilidad) return res.status(404).json({ error: 'Disponibilidad no encontrada' });

  if (!esAdmin(req.usuario)) {
    const cuidadores = await idsCuidadoresDe(req.usuario.id);
    if (!cuidadores.some((id) => igual(id, disponibilidad.cuidador_id))) {
      return res.status(403).json({ error: 'No puedes eliminar esta disponibilidad' });
    }
  }

  const { error } = await db.from('disponibilidad').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Disponibilidad eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
