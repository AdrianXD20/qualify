const { db } = require('../config/supabase');
const { esquemaMensaje } = require('../models/Mensaje');
const { idsCuidadoresDe, igual } = require('../utils/acceso');
const { obtenerCuidadoresDisponibles } = require('./cuidadoresController');

const LIMITE_DEFAULT = 50;
const LIMITE_MAX = 100;
const ERROR_MIGRACION =
  'El chat de consultas aún no está disponible: falta aplicar la migración 004 en Supabase';

function relacionComoObjeto(relacion) {
  return Array.isArray(relacion) ? relacion[0] || null : relacion || null;
}

function responderError(res, err) {
  if (/consultas_cuidadores|mensajes_consulta|schema cache/i.test(err.message)) {
    return res.status(503).json({ error: ERROR_MIGRACION });
  }
  return res.status(500).json({ error: err.message });
}

async function cargarContexto(consultaId) {
  const { data: consulta, error } = await db
    .from('consultas_cuidadores')
    .select('id, familiar_id, cuidador_id, creado_en, actualizado_en')
    .eq('id', consultaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!consulta) return null;

  const [{ data: cuidador, error: cuidadorError }, { data: familiar, error: familiarError }] =
    await Promise.all([
      db
        .from('cuidadores')
        .select('id, usuario_id, titulo, descripcion, especialidades, tarifa_hora, anios_experiencia')
        .eq('id', consulta.cuidador_id)
        .single(),
      db
        .from('usuarios')
        .select('id, nombre')
        .eq('id', consulta.familiar_id)
        .single(),
    ]);

  if (cuidadorError) throw cuidadorError;
  if (familiarError) throw familiarError;
  if (!cuidador || !familiar) return null;

  const { data: usuarioCuidador, error: usuarioCuidadorError } = await db
    .from('usuarios')
    .select('id, nombre')
    .eq('id', cuidador.usuario_id)
    .single();

  if (usuarioCuidadorError) throw usuarioCuidadorError;

  return {
    consulta,
    familiar: { id: familiar.id, nombre: familiar.nombre, rol: 'familiar' },
    cuidador_usuario_id: cuidador.usuario_id,
    cuidador: {
      cuidador_id: cuidador.id,
      nombre: usuarioCuidador ? usuarioCuidador.nombre : 'Cuidador',
      titulo: cuidador.titulo,
      descripcion: cuidador.descripcion,
      especialidades: cuidador.especialidades,
      tarifa_hora: cuidador.tarifa_hora,
      anios_experiencia: cuidador.anios_experiencia,
      rol: 'cuidador',
    },
  };
}

function esParticipante(usuario, contexto) {
  return Boolean(
    usuario &&
      contexto &&
      (
        igual(usuario.id, contexto.consulta.familiar_id) ||
        igual(usuario.id, contexto.cuidador_usuario_id)
      )
  );
}

async function contextoAutorizado(req, res) {
  const consultaId = Number(req.params.id);
  if (!Number.isInteger(consultaId) || consultaId < 1) {
    res.status(400).json({ error: 'El ID de la consulta debe ser un entero positivo' });
    return null;
  }

  const contexto = await cargarContexto(consultaId);
  if (!contexto) {
    res.status(404).json({ error: 'Consulta no encontrada' });
    return null;
  }
  if (!esParticipante(req.usuario, contexto)) {
    res.status(403).json({ error: 'No participas en esta consulta' });
    return null;
  }
  return contexto;
}

async function listar(req, res) {
  try {
    let consulta = db
      .from('consultas_cuidadores')
      .select(
        'id, familiar_id, cuidador_id, creado_en, actualizado_en, cuidadores(id, usuario_id, titulo, descripcion, especialidades, tarifa_hora, anios_experiencia)'
      )
      .order('actualizado_en', { ascending: false });

    if (req.usuario.rol === 'familiar') {
      consulta = consulta.eq('familiar_id', req.usuario.id);
    } else if (req.usuario.rol === 'cuidador') {
      const idsCuidadores = await idsCuidadoresDe(req.usuario.id);
      if (idsCuidadores.length === 0) return res.json([]);
      consulta = consulta.in('cuidador_id', idsCuidadores);
    } else {
      return res.status(403).json({ error: 'Solo familiares y cuidadores pueden consultar chats' });
    }

    const { data: consultas, error } = await consulta;
    if (error) throw error;
    if (!consultas || consultas.length === 0) return res.json([]);

    const familiarIds = [...new Set(consultas.map((item) => item.familiar_id))];
    const cuidadores = consultas
      .map((item) => relacionComoObjeto(item.cuidadores))
      .filter(Boolean);
    const usuarioIds = [...new Set(cuidadores.map((item) => item.usuario_id))];
    const [{ data: familiares, error: familiaresError }, { data: usuarios, error: usuariosError }] =
      await Promise.all([
        db.from('usuarios').select('id, nombre').in('id', familiarIds),
        db.from('usuarios').select('id, nombre').in('id', usuarioIds),
      ]);

    if (familiaresError) throw familiaresError;
    if (usuariosError) throw usuariosError;

    const nombresFamiliares = new Map((familiares || []).map((item) => [String(item.id), item.nombre]));
    const nombresCuidadores = new Map((usuarios || []).map((item) => [String(item.id), item.nombre]));

    res.json(
      consultas.map((item) => {
        const cuidador = relacionComoObjeto(item.cuidadores);
        return {
          consulta_id: item.id,
          familiar_id: item.familiar_id,
          cuidador_id: item.cuidador_id,
          creado_en: item.creado_en,
          actualizado_en: item.actualizado_en,
          familiar: {
            id: item.familiar_id,
            nombre: nombresFamiliares.get(String(item.familiar_id)) || null,
          },
          cuidador: cuidador
            ? {
                cuidador_id: cuidador.id,
                nombre: nombresCuidadores.get(String(cuidador.usuario_id)) || 'Cuidador',
                titulo: cuidador.titulo,
                descripcion: cuidador.descripcion,
                especialidades: cuidador.especialidades,
                tarifa_hora: cuidador.tarifa_hora,
                anios_experiencia: cuidador.anios_experiencia,
              }
            : null,
        };
      })
    );
  } catch (err) {
    responderError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const contexto = await contextoAutorizado(req, res);
    if (!contexto) return;

    const { count, error } = await db
      .from('mensajes_consulta')
      .select('id', { count: 'exact', head: true })
      .eq('consulta_id', contexto.consulta.id)
      .neq('emisor_id', req.usuario.id)
      .is('leido_en', null);

    if (error) throw error;

    res.json({
      consulta_id: contexto.consulta.id,
      creado_en: contexto.consulta.creado_en,
      actualizado_en: contexto.consulta.actualizado_en,
      familiar: contexto.familiar,
      cuidador: contexto.cuidador,
      no_leidos: count || 0,
    });
  } catch (err) {
    responderError(res, err);
  }
}

async function abrir(req, res) {
  if (req.usuario.rol !== 'familiar') {
    return res.status(403).json({ error: 'Solo un familiar puede iniciar una consulta con un cuidador' });
  }

  const cuidadorId = Number(req.params.cuidador_id);
  if (!Number.isInteger(cuidadorId) || cuidadorId < 1) {
    return res.status(400).json({ error: 'El ID del cuidador debe ser un entero positivo' });
  }

  try {
    const disponibles = await obtenerCuidadoresDisponibles();
    if (!disponibles.some((cuidador) => igual(cuidador.cuidador_id, cuidadorId))) {
      return res.status(409).json({
        error: 'El cuidador ya no está disponible o no tiene una ubicación reciente',
      });
    }

    const { data: consulta, error } = await db
      .from('consultas_cuidadores')
      .upsert(
        {
          familiar_id: req.usuario.id,
          cuidador_id: cuidadorId,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'familiar_id,cuidador_id' }
      )
      .select('id')
      .single();

    if (error) {
      if (/consultas_cuidadores|schema cache/i.test(error.message)) {
        return res.status(503).json({ error: ERROR_MIGRACION });
      }
      throw error;
    }

    const contexto = await cargarContexto(consulta.id);
    if (!contexto) return res.status(500).json({ error: 'No se pudo cargar la consulta creada' });

    res.status(200).json({
      consulta_id: contexto.consulta.id,
      creado_en: contexto.consulta.creado_en,
      actualizado_en: contexto.consulta.actualizado_en,
      familiar: contexto.familiar,
      cuidador: contexto.cuidador,
    });
  } catch (err) {
    responderError(res, err);
  }
}

async function listarMensajes(req, res) {
  try {
    const contexto = await contextoAutorizado(req, res);
    if (!contexto) return;

    const limite = Math.min(
      LIMITE_MAX,
      Math.max(1, Number.parseInt(req.query.limite, 10) || LIMITE_DEFAULT)
    );
    const antesDeId = Number.parseInt(req.query.antes_de_id, 10);

    let consulta = db
      .from('mensajes_consulta')
      .select('id, consulta_id, emisor_id, contenido, creado_en, leido_en')
      .eq('consulta_id', contexto.consulta.id)
      .order('id', { ascending: false })
      .limit(limite);

    if (Number.isFinite(antesDeId) && antesDeId > 0) {
      consulta = consulta.lt('id', antesDeId);
    }

    const { data: mensajes, error } = await consulta;
    if (error) {
      if (/mensajes_consulta|schema cache/i.test(error.message)) {
        return res.status(503).json({ error: ERROR_MIGRACION });
      }
      throw error;
    }

    res.json((mensajes || []).slice().reverse());
  } catch (err) {
    responderError(res, err);
  }
}

async function enviar(req, res) {
  try {
    const contexto = await contextoAutorizado(req, res);
    if (!contexto) return;

    const { error: validacionError } = esquemaMensaje.validate(req.body);
    if (validacionError) {
      return res.status(400).json({ error: validacionError.details[0].message });
    }

    const { data: emisor, error: emisorError } = await db
      .from('usuarios')
      .select('id, nombre, rol')
      .eq('id', req.usuario.id)
      .single();

    if (emisorError) throw emisorError;

    const ahora = new Date().toISOString();
    const { data: mensaje, error } = await db
      .from('mensajes_consulta')
      .insert({
        consulta_id: contexto.consulta.id,
        emisor_id: req.usuario.id,
        contenido: req.body.contenido.trim(),
      })
      .select('id, consulta_id, emisor_id, contenido, creado_en, leido_en')
      .single();

    if (error) {
      if (/mensajes_consulta|schema cache/i.test(error.message)) {
        return res.status(503).json({ error: ERROR_MIGRACION });
      }
      throw error;
    }

    const { error: actualizarError } = await db
      .from('consultas_cuidadores')
      .update({ actualizado_en: ahora })
      .eq('id', contexto.consulta.id);

    if (actualizarError) throw actualizarError;

    const respuesta = {
      ...mensaje,
      emisor: emisor || { id: req.usuario.id, rol: req.usuario.rol },
    };
    const io = req.app.get('io');
    if (io) {
      io.to(`consulta_cuidadores_${contexto.consulta.id}`).emit(
        'mensaje_consulta_nuevo',
        respuesta
      );
      io.to(`usuario_${contexto.familiar.id}`).emit('mensaje_consulta_nuevo', respuesta);
      io.to(`usuario_${contexto.cuidador_usuario_id}`).emit('mensaje_consulta_nuevo', respuesta);
    }

    res.status(201).json(respuesta);
  } catch (err) {
    responderError(res, err);
  }
}

async function marcarLeidos(req, res) {
  try {
    const contexto = await contextoAutorizado(req, res);
    if (!contexto) return;

    const { data: mensajes, error } = await db
      .from('mensajes_consulta')
      .update({ leido_en: new Date().toISOString() })
      .eq('consulta_id', contexto.consulta.id)
      .neq('emisor_id', req.usuario.id)
      .is('leido_en', null)
      .select('id');

    if (error) {
      if (/mensajes_consulta|schema cache/i.test(error.message)) {
        return res.status(503).json({ error: ERROR_MIGRACION });
      }
      throw error;
    }

    const aviso = {
      consulta_id: contexto.consulta.id,
      por_usuario_id: req.usuario.id,
      ids: (mensajes || []).map((mensaje) => mensaje.id),
    };
    const io = req.app.get('io');
    if (io) {
      io.to(`consulta_cuidadores_${contexto.consulta.id}`).emit(
        'mensajes_consulta_leidos',
        aviso
      );
    }

    res.json({ actualizados: aviso.ids.length });
  } catch (err) {
    responderError(res, err);
  }
}

async function autorizarSala(usuario, consultaId) {
  const consultaIdNumero = Number(consultaId);
  if (!Number.isInteger(consultaIdNumero) || consultaIdNumero < 1) {
    return { error: 'El ID de la consulta no es válido' };
  }

  const contexto = await cargarContexto(consultaIdNumero);
  if (!contexto) return { error: 'Consulta no encontrada' };
  if (!esParticipante(usuario, contexto)) return { error: 'No participas en esta consulta' };

  return { consulta_id: contexto.consulta.id };
}

module.exports = {
  listar,
  obtener,
  abrir,
  listarMensajes,
  enviar,
  marcarLeidos,
  autorizarSala,
};
