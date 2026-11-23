const { db } = require('../config/supabase');

// Ubicación aproximada: se redondea a una cuadrícula de ~200 m para no
// revelar la posición exacta de los cuidadores en el mapa público.
const PASO_LATITUD = 0.0018;

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

module.exports = { redondearCoordenadas, marcarCuidadorOcupado };
