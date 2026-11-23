const { db } = require('../config/supabase');
const { esquemaMensaje } = require('../models/Mensaje');
const {
  obtenerServicioParaChat,
  esParticipante,
  chatHabilitado,
  ESTADOS_CERRADOS,
} = require('../utils/chat');

const LIMITE_DEFAULT = 50;
const LIMITE_MAX = 100;

// Carga el servicio y valida que el usuario participe en él.
async function cargarContexto(req, res) {
  const contexto = await obtenerServicioParaChat(req.params.id);

  if (!contexto) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return null;
  }

  if (!esParticipante(req.usuario, contexto)) {
    res.status(403).json({ error: 'No participas en este servicio' });
    return null;
  }

  return contexto;
}

// Nombres de las dos partes para que el front pinte el encabezado del chat.
async function nombresParticipantes(contexto) {
  const ids = [contexto.familiar_id, contexto.cuidador_usuario_id].filter(Boolean);
  if (ids.length === 0) return { familiar: null, cuidador: null };

  const { data } = await db.from('usuarios').select('id, nombre, rol').in('id', ids);
  const porId = new Map((data || []).map((u) => [String(u.id), u]));

  return {
    familiar: porId.get(String(contexto.familiar_id)) || null,
    cuidador: porId.get(String(contexto.cuidador_usuario_id)) || null,
  };
}

// GET /api/servicios/:id/chat
async function contextoChat(req, res) {
  const contexto = await cargarContexto(req, res);
  if (!contexto) return;

  const { servicio } = contexto;
  const habilitado = chatHabilitado(servicio);

  const [{ count: noLeidos }, participantes] = await Promise.all([
    habilitado
      ? db
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('servicio_id', servicio.id)
          .neq('emisor_id', req.usuario.id)
          .is('leido_en', null)
      : Promise.resolve({ count: 0 }),
    nombresParticipantes(contexto),
  ]);

  res.json({
    servicio_id: servicio.id,
    habilitado,
    estado: servicio.estado,
    aceptado_por_familiar: servicio.aceptado_por_familiar === true,
    aceptado_por_cuidador: servicio.aceptado_por_cuidador === true,
    motivo: habilitado
      ? null
      : ESTADOS_CERRADOS.includes(servicio.estado)
        ? 'El servicio está cerrado'
        : 'El chat se habilita cuando el cuidador acepta la cita',
    participantes,
    no_leidos: noLeidos || 0,
  });
}

// GET /api/servicios/:id/mensajes?limite=50&antes_de_id=123
async function listar(req, res) {
  const contexto = await cargarContexto(req, res);
  if (!contexto) return;

  if (!chatHabilitado(contexto.servicio)) {
    return res.status(403).json({
      error: 'El chat aún no está habilitado: falta que el cuidador acepte la cita',
    });
  }

  const limite = Math.min(
    LIMITE_MAX,
    Math.max(1, Number.parseInt(req.query.limite, 10) || LIMITE_DEFAULT)
  );
  const antesDeId = Number.parseInt(req.query.antes_de_id, 10);

  let query = db
    .from('mensajes')
    .select('id, servicio_id, emisor_id, contenido, creado_en, leido_en')
    .eq('servicio_id', contexto.servicio.id)
    .order('id', { ascending: false })
    .limit(limite);

  if (Number.isFinite(antesDeId) && antesDeId > 0) {
    query = query.lt('id', antesDeId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Devolvemos en orden cronológico (el front solo agrega al final).
  res.json((data || []).slice().reverse());
}

// POST /api/servicios/:id/mensajes
async function enviar(req, res) {
  const contexto = await cargarContexto(req, res);
  if (!contexto) return;

  if (!chatHabilitado(contexto.servicio)) {
    return res.status(403).json({
      error: 'El chat aún no está habilitado: falta que el cuidador acepte la cita',
    });
  }

  const { error } = esquemaMensaje.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const contenido = req.body.contenido.trim();

  const { data: emisor } = await db
    .from('usuarios')
    .select('id, nombre, rol')
    .eq('id', req.usuario.id)
    .single();

  const { data, error: dbError } = await db
    .from('mensajes')
    .insert([
      {
        servicio_id: contexto.servicio.id,
        emisor_id: req.usuario.id,
        contenido,
      },
    ])
    .select('id, servicio_id, emisor_id, contenido, creado_en, leido_en')
    .single();

  if (dbError) {
    if (/mensajes|schema cache/i.test(dbError.message)) {
      return res.status(503).json({
        error: 'El chat aún no está disponible: falta aplicar la migración 003 en Supabase',
      });
    }
    return res.status(400).json({ error: dbError.message });
  }

  const mensaje = {
    ...data,
    emisor: emisor || { id: req.usuario.id, nombre: null, rol: req.usuario.rol },
  };

  // Entrega en vivo a quien esté suscrito a la sala del servicio.
  const io = req.app.get('io');
  if (io) {
    io.to(`chat_servicio_${contexto.servicio.id}`).emit('mensaje_nuevo', mensaje);
    io.to(`usuario_${contexto.familiar_id}`).emit('mensaje_nuevo', mensaje);
    io.to(`usuario_${contexto.cuidador_usuario_id}`).emit('mensaje_nuevo', mensaje);
  }

  res.status(201).json(mensaje);
}

// PUT /api/servicios/:id/mensajes/leidos
async function marcarLeidos(req, res) {
  const contexto = await cargarContexto(req, res);
  if (!contexto) return;

  const { data, error } = await db
    .from('mensajes')
    .update({ leido_en: new Date().toISOString() })
    .eq('servicio_id', contexto.servicio.id)
    .neq('emisor_id', req.usuario.id)
    .is('leido_en', null)
    .select('id');

  if (error) {
    if (/mensajes|schema cache/i.test(error.message)) {
      return res.status(503).json({
        error: 'El chat aún no está disponible: falta aplicar la migración 003 en Supabase',
      });
    }
    return res.status(500).json({ error: error.message });
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`chat_servicio_${contexto.servicio.id}`).emit('mensajes_leidos', {
      servicio_id: contexto.servicio.id,
      por_usuario_id: req.usuario.id,
      ids: (data || []).map((m) => m.id),
    });
  }

  res.json({ actualizados: (data || []).length });
}

module.exports = { contextoChat, listar, enviar, marcarLeidos };
