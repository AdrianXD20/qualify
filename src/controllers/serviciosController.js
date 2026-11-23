const { db } = require('../config/supabase');
const { esquemaServicio } = require('../models/Servicio');
const {
  esAdmin,
  igual,
  abuelosPermitidos,
  permiteAbuelo,
  soloCampos,
} = require('../utils/acceso');
const { marcarCuidadorOcupado } = require('../utils/geolocalizacion');
const {
  obtenerServicioParaChat,
  chatHabilitado,
  ESTADOS_CERRADOS,
} = require('../utils/chat');

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

  const fila = {
    ...req.body,
    // Quien contrata la cita ya la aceptó; falta la aceptación del cuidador.
    aceptado_por_familiar: true,
    aceptado_familiar_en: new Date().toISOString(),
    aceptado_por_cuidador: false,
  };

  let { data, error: dbError } = await db.from('servicios').insert([fila]).select().single();

  // Si la migración 003 aún no está aplicada, la cita se crea igual y el chat
  // simplemente queda deshabilitado (no rompemos la contratación).
  if (dbError && /aceptado_por_/.test(dbError.message)) {
    ({ data, error: dbError } = await db.from('servicios').insert([req.body]).select().single());
  }

  if (dbError) return res.status(400).json({ error: dbError.message });
  if (!data) return res.status(500).json({ error: 'No se pudo crear el servicio' });

  // Al confirmar una cita el cuidador deja de estar libre y desaparece del mapa.
  const estado = data.estado || 'activo';
  if (estado !== 'cancelado' && estado !== 'completado') {
    await marcarCuidadorOcupado(data.cuidador_id, req.app.get('io'));
  }

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

  // Si la cita queda activa, el cuidador deja de aparecer como libre.
  if (data.estado === 'activo') {
    await marcarCuidadorOcupado(data.cuidador_id, req.app.get('io'));
  }

  res.json(data);
}

// PUT /api/servicios/:id/aceptar
// El familiar ya aceptó al crear la cita; aquí el cuidador confirma.
// Cuando ambas partes aceptaron se habilita el chat.
async function aceptar(req, res) {
  const contexto = await obtenerServicioParaChat(req.params.id);
  if (!contexto) return res.status(404).json({ error: 'Servicio no encontrado' });

  const { servicio, familiar_id, cuidador_usuario_id } = contexto;

  if (ESTADOS_CERRADOS.includes(servicio.estado)) {
    return res.status(400).json({ error: 'El servicio ya está cerrado' });
  }

  const esFamiliar = igual(familiar_id, req.usuario.id);
  const esCuidador = igual(cuidador_usuario_id, req.usuario.id);

  if (!esFamiliar && !esCuidador) {
    return res.status(403).json({ error: 'No participas en este servicio' });
  }

  const cambios = {};
  if (esFamiliar) {
    cambios.aceptado_por_familiar = true;
    cambios.aceptado_familiar_en = servicio.aceptado_familiar_en || new Date().toISOString();
  }
  if (esCuidador) {
    cambios.aceptado_por_cuidador = true;
    cambios.aceptado_cuidador_en = servicio.aceptado_cuidador_en || new Date().toISOString();
  }

  const { data, error } = await db
    .from('servicios')
    .update(cambios)
    .eq('id', servicio.id)
    .select()
    .single();

  if (error) {
    if (/aceptado_por_|schema cache/i.test(error.message)) {
      return res.status(503).json({
        error: 'La aceptación de citas aún no está disponible: falta aplicar la migración 003 en Supabase',
      });
    }
    return res.status(400).json({ error: error.message });
  }

  const habilitado = chatHabilitado(data);

  const io = req.app.get('io');
  if (io && habilitado) {
    const aviso = { servicio_id: servicio.id, habilitado: true };
    io.to(`usuario_${familiar_id}`).emit('chat_habilitado', aviso);
    io.to(`usuario_${cuidador_usuario_id}`).emit('chat_habilitado', aviso);
    io.to(`chat_servicio_${servicio.id}`).emit('chat_habilitado', aviso);
  }

  res.json({ ...data, chat_habilitado: habilitado });
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

module.exports = { listar, obtener, crear, actualizar, aceptar, eliminar };
