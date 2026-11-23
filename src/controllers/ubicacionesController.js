const { db } = require('../config/supabase');
const { esquemaUbicacion, esquemaTiempoReal } = require('../models/Ubicacion');
const {
  abuelosPermitidos,
  permiteAbuelo,
  idsCuidadoresDe,
  soloCampos,
} = require('../utils/acceso');

// Función simple para calcular distancia entre dos puntos (metros)
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function listar(req, res) {
  const permitidos = await abuelosPermitidos(req.usuario);
  if (permitidos !== null && permitidos.length === 0) return res.json([]);

  let query = db.from('ubicaciones').select('*');
  if (permitidos !== null) query = query.in('abuelo_id', permitidos);

  const { data, error } = await query.order('fecha', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtener(req, res) {
  const { data, error } = await db
    .from('ubicaciones')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Ubicación no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, data.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta ubicación' });
  }

  res.json(data);
}

async function crear(req, res) {
  const { error } = esquemaUbicacion.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, req.body.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  const { data, error: dbError } = await db
    .from('ubicaciones')
    .insert([req.body])
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: dbError.message });
  res.status(201).json(data);
}

// Endpoint principal para tipo Life360: recibe ubicación en tiempo real del cuidador
async function tiempoReal(req, res, io) {
  try {
    const { error } = esquemaTiempoReal.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { cuidador_id, abuelo_id, latitud, longitud, velocidad, direccion_grados, precision_metros, bateria } = req.body;

    const permitidos = await abuelosPermitidos(req.usuario);
    if (!permiteAbuelo(permitidos, abuelo_id)) {
      return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
    }

    // Un cuidador solo puede enviar ubicaciones de su propio perfil.
    if (req.usuario.rol === 'cuidador') {
      const cuidadores = await idsCuidadoresDe(req.usuario.id);
      if (!cuidadores.some((id) => String(id) === String(cuidador_id))) {
        return res.status(403).json({ error: 'El cuidador no corresponde a tu usuario' });
      }
    }

    // Guardar en tabla ubicaciones
    const { data, error: dbError } = await db
      .from('ubicaciones')
      .insert([{
        abuelo_id,
        cuidador_id,
        latitud,
        longitud,
        velocidad,
        direccion_grados,
        precision_metros,
        bateria,
        fecha: new Date().toISOString(),
      }])
      .select()
      .single();

    if (dbError) return res.status(400).json({ error: dbError.message });

    // Verificar geocercas y generar alertas si el cuidador sale de la zona
    const { data: geocercas } = await db
      .from('geocercas')
      .select('*')
      .eq('abuelo_id', abuelo_id)
      .eq('activo', true);

    if (geocercas && geocercas.length > 0) {
      for (const g of geocercas) {
        const distancia = haversine(latitud, longitud, g.latitud, g.longitud);
        const dentro = distancia <= g.radio_metros;

        if (!dentro) {
          // Alerta de salida de zona
          await db.from('alertas_ubicacion').insert([{
            abuelo_id,
            cuidador_id,
            tipo: 'salida_zona',
            mensaje: `El cuidador salió de la zona "${g.nombre}"`,
            latitud,
            longitud,
          }]);

          // Emitir alerta por socket
          if (io) {
            io.to(`abuelo_${abuelo_id}`).emit('alerta_ubicacion', {
              tipo: 'salida_zona',
              mensaje: `El cuidador salió de la zona "${g.nombre}"`,
              latitud,
              longitud,
              creado_en: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Emitir ubicación actualizada por socket a los familiares del abuelo
    if (io) {
      io.to(`abuelo_${abuelo_id}`).emit('ubicacion_actualizada', {
        id: data.id,
        cuidador_id,
        abuelo_id,
        latitud,
        longitud,
        velocidad,
        direccion_grados,
        precision_metros,
        bateria,
        fecha: new Date().toISOString(),
      });
    }

    res.status(201).json({ mensaje: 'Ubicación recibida y emitida en tiempo real', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function actualizar(req, res) {
  const { data: ubicacion } = await db
    .from('ubicaciones')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!ubicacion) return res.status(404).json({ error: 'Ubicación no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, ubicacion.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta ubicación' });
  }

  const cambios = soloCampos(req.body, [
    'latitud', 'longitud', 'velocidad', 'direccion_grados', 'precision_metros', 'bateria',
  ]);
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const { data, error } = await db
    .from('ubicaciones')
    .update(cambios)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function eliminar(req, res) {
  const { data: ubicacion } = await db
    .from('ubicaciones')
    .select('id, abuelo_id')
    .eq('id', req.params.id)
    .single();

  if (!ubicacion) return res.status(404).json({ error: 'Ubicación no encontrada' });

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, ubicacion.abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a esta ubicación' });
  }

  const { error } = await db.from('ubicaciones').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Ubicación eliminada' });
}

// Última ubicación conocida de un cuidador para un abuelo
async function ultimaPorAbuelo(req, res) {
  const { abuelo_id } = req.params;

  const permitidos = await abuelosPermitidos(req.usuario);
  if (!permiteAbuelo(permitidos, abuelo_id)) {
    return res.status(403).json({ error: 'No tienes acceso a este abuelo' });
  }

  const { data, error } = await db
    .from('ubicaciones')
    .select('*')
    .eq('abuelo_id', abuelo_id)
    .order('fecha', { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Sin ubicaciones registradas' });
  res.json(data[0]);
}

module.exports = { listar, obtener, crear, tiempoReal, actualizar, eliminar, ultimaPorAbuelo };
