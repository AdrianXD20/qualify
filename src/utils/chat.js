const { db } = require('../config/supabase');

const ESTADOS_CERRADOS = ['cancelado', 'completado'];

// Carga el servicio y los usuarios que participan en él.
async function obtenerServicioParaChat(servicioId) {
  const { data: servicio } = await db
    .from('servicios')
    .select('*')
    .eq('id', servicioId)
    .single();

  if (!servicio) return null;

  const [{ data: abuelo }, { data: cuidador }] = await Promise.all([
    db.from('abuelos').select('familiar_id').eq('id', servicio.abuelo_id).single(),
    db.from('cuidadores').select('usuario_id').eq('id', servicio.cuidador_id).single(),
  ]);

  return {
    servicio,
    familiar_id: abuelo ? abuelo.familiar_id : null,
    cuidador_usuario_id: cuidador ? cuidador.usuario_id : null,
  };
}

function esParticipante(usuario, contexto) {
  if (!usuario || !contexto) return false;
  // Privacidad: ni siquiera un admin lee chats ajenos. Solo las dos partes.
  return (
    String(usuario.id) === String(contexto.familiar_id) ||
    String(usuario.id) === String(contexto.cuidador_usuario_id)
  );
}

// El chat se habilita cuando el familiar creó la cita y el cuidador la aceptó.
function chatHabilitado(servicio) {
  if (!servicio) return false;
  if (ESTADOS_CERRADOS.includes(servicio.estado)) return false;
  return (
    servicio.aceptado_por_cuidador === true &&
    servicio.aceptado_por_familiar !== false
  );
}

module.exports = {
  obtenerServicioParaChat,
  esParticipante,
  chatHabilitado,
  ESTADOS_CERRADOS,
};
