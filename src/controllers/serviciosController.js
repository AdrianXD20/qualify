const { supabase } = require('../config/supabase');
const { esquemaServicio } = require('../models/Servicio');

async function listar(req, res) {
  const { data, error } = await supabase
    .from('servicios')
    .select('*, abuelos(nombre), cuidadores(id)');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaServicio.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Verificar que el cuidador esté verificado antes de crear el servicio
  const { data: cuidador } = await supabase
    .from('cuidadores')
    .select('verificado')
    .eq('id', req.body.cuidador_id)
    .single();

  if (!cuidador || !cuidador.verificado) {
    return res.status(403).json({ error: 'El cuidador no está verificado para prestar servicios' });
  }

  const { data, error: dbError } = await supabase
    .from('servicios')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

async function actualizar(req, res) {
  const { data, error } = await supabase
    .from('servicios')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json(data);
}

async function eliminar(req, res) {
  const { error } = await supabase.from('servicios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Servicio eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
