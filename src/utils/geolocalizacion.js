const { db } = require('../config/supabase');
const { geocodificarInversa } = require('../services/geocodificacion');

// Ubicación aproximada: se redondea a una cuadrícula de ~200 m para no
// revelar la posición exacta de los cuidadores en el mapa público.
const PASO_LATITUD = 0.0018;
const DIRECCION_TTL_MS = 5 * 60 * 1000;

function redondearCoordenadas(latitud, longitud) {
  const lat = Number(latitud);
  const lng = Number(longitud);

  const latRedondeada = Math.round(lat / PASO_LATITUD) * PASO_LATITUD;
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const pasoLongitud = PASO_LATITUD / cos;
  const lngRedondeada = Math.round(lng / pasoLongitud) * pasoLongitud;

  return {
    latitud: Number(latRedondeada.toFixed(4)),
    longitud: Number(lngRedondeada.toFixed(4)),
    precision_metros: 200,
  };
}

// Un cuidador deja de estar libre en cuanto acepta/confirma una cita.
async function marcarCuidadorOcupado(cuidadorId, io) {
  try {
    await db
      .from('cuidadores')
      .update({ disponible: false, disponible_desde: null })
      .eq('id', cuidadorId);

    await db.from('ubicaciones_libres').delete().eq('cuidador_id', cuidadorId);

    if (io) {
      io.to('cuidadores_libres').emit('cuidador_no_disponible', {
        cuidador_id: cuidadorId,
      });
    }
  } catch (err) {
    // No romper la creación del servicio si la migración aún no está aplicada.
    console.warn('No se pudo marcar al cuidador como ocupado:', err.message);
  }
}

// Actualiza en segundo plano la dirección legible de la ubicación libre.
// Se hace como máximo cada 5 minutos para respetar el límite de Nominatim
// (las coordenadas ya están redondeadas, así que la caché acierta seguido).
async function refrescarDireccionLibre(cuidadorId, latitud, longitud) {
  try {
    const { data, error } = await db
      .from('ubicaciones_libres')
      .select('direccion_actualizada_en')
      .eq('cuidador_id', cuidadorId)
      .single();

    // Si la migración 002 aún no está aplicada, no intentamos geocodificar.
    if (error) return;

    if (data && data.direccion_actualizada_en) {
      const edad = Date.now() - new Date(data.direccion_actualizada_en).getTime();
      if (edad < DIRECCION_TTL_MS) return;
    }

    const direccion = await geocodificarInversa(latitud, longitud);
    if (!direccion) return;

    await db
      .from('ubicaciones_libres')
      .update({
        direccion_formateada: direccion.direccion_formateada,
        direccion_actualizada_en: new Date().toISOString(),
      })
      .eq('cuidador_id', cuidadorId);
  } catch (err) {
    // La dirección es un extra: nunca debe romper el reporte de ubicación.
    console.warn('No se pudo actualizar la dirección del cuidador libre:', err.message);
  }
}

module.exports = { redondearCoordenadas, marcarCuidadorOcupado, refrescarDireccionLibre };
