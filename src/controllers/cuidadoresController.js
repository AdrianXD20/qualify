const { db } = require('../config/supabase');
const { esquemaCuidador } = require('../models/Cuidador');
const { esAdmin, igual, soloCampos } = require('../utils/acceso');
const { redondearCoordenadas, refrescarDireccionLibre } = require('../utils/geolocalizacion');

// Una ubicación deja de mostrarse si el cuidador no la actualiza en 2 minutos.
const MAX_ANTIGUEDAD_MS = 2 * 60 * 1000;

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

  // Al eliminar el perfil también se borra su ubicación pública.
  await db.from('ubicaciones_libres').delete().eq('cuidador_id', req.params.id);

  const { error } = await db.from('cuidadores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: 'Cuidador eliminado' });
}

// GET /api/cuidadores/mapa
// Devuelve solo cuidadores verificados, disponibles, con ubicación reciente
// y sin un servicio activo en este momento.
async function mapa(req, res) {
  try {
    const { data: cuidadores, error } = await db
      .from('cuidadores')
      .select('id, usuario_id, especialidades, tarifa_hora, anios_experiencia')
      .eq('disponible', true)
      .eq('verificado', true);

    if (error) return res.status(500).json({ error: error.message });
    if (!cuidadores || cuidadores.length === 0) return res.json([]);

    const ids = cuidadores.map((c) => c.id);

    const [{ data: ubicaciones }, { data: servicios }] = await Promise.all([
      db
        .from('ubicaciones_libres')
        .select('*')
        .in('cuidador_id', ids),
      db
        .from('servicios')
        .select('cuidador_id, inicio, fin')
        .eq('estado', 'activo')
        .in('cuidador_id', ids),
    ]);

    const ahora = Date.now();

    // Un servicio activo (cita confirmada en curso) oculta al cuidador.
    const ocupados = new Set(
      (servicios || [])
        .filter(
          (s) =>
            (!s.inicio || new Date(s.inicio).getTime() <= ahora) &&
            (!s.fin || new Date(s.fin).getTime() >= ahora)
        )
        .map((s) => String(s.cuidador_id))
    );

    const ubicacionesVigentes = new Map(
      (ubicaciones || [])
        .filter((u) => ahora - new Date(u.actualizado_en).getTime() <= MAX_ANTIGUEDAD_MS)
        .map((u) => [String(u.cuidador_id), u])
    );

    const libres = cuidadores.filter(
      (c) => !ocupados.has(String(c.id)) && ubicacionesVigentes.has(String(c.id))
    );

    if (libres.length === 0) return res.json([]);

    const { data: usuarios } = await db
      .from('usuarios')
      .select('id, nombre')
      .in('id', libres.map((c) => c.usuario_id));

    const nombres = new Map((usuarios || []).map((u) => [String(u.id), u.nombre]));

    const resultado = libres.map((c) => {
      const ubicacion = ubicacionesVigentes.get(String(c.id));
      const { latitud, longitud, precision_metros } = redondearCoordenadas(
        ubicacion.latitud,
        ubicacion.longitud
      );

      return {
        cuidador_id: c.id,
        nombre: nombres.get(String(c.usuario_id)) || 'Cuidador',
        especialidades: c.especialidades,
        tarifa_hora: c.tarifa_hora,
        anios_experiencia: c.anios_experiencia,
        latitud,
        longitud,
        precision_metros,
        direccion_formateada: ubicacion.direccion_formateada || null,
        actualizado_en: ubicacion.actualizado_en,
      };
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/cuidadores/:id/disponible
async function cambiarDisponible(req, res) {
  const { disponible } = req.body;

  if (typeof disponible !== 'boolean') {
    return res.status(400).json({ error: 'El campo "disponible" debe ser true o false' });
  }

  const { data: cuidador } = await db
    .from('cuidadores')
    .select('id, usuario_id, verificado, disponible')
    .eq('id', req.params.id)
    .single();

  if (!cuidador) return res.status(404).json({ error: 'Cuidador no encontrado' });
  if (!esAdmin(req.usuario) && !igual(cuidador.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes cambiar la disponibilidad de otro cuidador' });
  }

  if (disponible && !cuidador.verificado) {
    return res.status(403).json({ error: 'Tu perfil debe estar verificado para aparecer en el mapa' });
  }

  const cambios = disponible
    ? { disponible: true, disponible_desde: new Date().toISOString() }
    : { disponible: false, disponible_desde: null };

  const { data, error } = await db
    .from('cuidadores')
    .update(cambios)
    .eq('id', req.params.id)
    .select('id, disponible, disponible_desde')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (!disponible) {
    await db.from('ubicaciones_libres').delete().eq('cuidador_id', req.params.id);
    const io = req.app.get('io');
    if (io) {
      io.to('cuidadores_libres').emit('cuidador_no_disponible', { cuidador_id: Number(req.params.id) });
    }
  }

  res.json(data);
}

// PUT /api/cuidadores/:id/ubicacion
// El cuidador reporta su ubicación mientras está disponible. Se guarda ya
// redondeada a ~200 m: la posición exacta nunca se almacena ni se expone.
async function reportarUbicacion(req, res) {
  const { latitud, longitud, precision_metros } = req.body;

  if (typeof latitud !== 'number' || typeof longitud !== 'number') {
    return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
  }
  if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
    return res.status(400).json({ error: 'Coordenadas fuera de rango' });
  }

  const { data: cuidador } = await db
    .from('cuidadores')
    .select('id, usuario_id, verificado, disponible')
    .eq('id', req.params.id)
    .single();

  if (!cuidador) return res.status(404).json({ error: 'Cuidador no encontrado' });
  if (!esAdmin(req.usuario) && !igual(cuidador.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'No puedes reportar la ubicación de otro cuidador' });
  }

  if (!cuidador.verificado) {
    return res.status(403).json({ error: 'Tu perfil debe estar verificado para compartir ubicación' });
  }

  if (!cuidador.disponible) {
    return res.status(409).json({ error: 'Activa "Estoy disponible" antes de compartir tu ubicación' });
  }

  const { data: servicioActivo } = await db
    .from('servicios')
    .select('id')
    .eq('cuidador_id', req.params.id)
    .eq('estado', 'activo')
    .limit(1);

  if (servicioActivo && servicioActivo.length > 0) {
    return res.status(409).json({ error: 'Tienes un servicio activo; ya no apareces en el mapa' });
  }

  const aproximada = redondearCoordenadas(latitud, longitud);

  const { error } = await db.from('ubicaciones_libres').upsert(
    {
      cuidador_id: Number(req.params.id),
      latitud: aproximada.latitud,
      longitud: aproximada.longitud,
      precision_metros: typeof precision_metros === 'number' ? precision_metros : aproximada.precision_metros,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'cuidador_id' }
  );

  if (error) return res.status(400).json({ error: error.message });

  // La dirección se resuelve en segundo plano (máximo cada 5 min).
  refrescarDireccionLibre(Number(req.params.id), aproximada.latitud, aproximada.longitud);

  const io = req.app.get('io');
  if (io) {
    io.to('cuidadores_libres').emit('ubicacion_cuidador_libre', {
      cuidador_id: Number(req.params.id),
      latitud: aproximada.latitud,
      longitud: aproximada.longitud,
      precision_metros: aproximada.precision_metros,
      actualizado_en: new Date().toISOString(),
    });
  }

  res.json({
    mensaje: 'Ubicación aproximada actualizada',
    cuidador_id: Number(req.params.id),
    latitud: aproximada.latitud,
    longitud: aproximada.longitud,
    precision_metros: aproximada.precision_metros,
  });
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  mapa,
  cambiarDisponible,
  reportarUbicacion,
};
