const { db } = require('../config/supabase');

// La API se conecta con la service role key (salta RLS), por lo que el control
// de acceso a los datos se hace aquí, a partir del usuario del JWT.

function igual(a, b) {
  return String(a) === String(b);
}

function esAdmin(usuario) {
  return Boolean(usuario && usuario.rol === 'admin');
}

// Devuelve los IDs de los cuidadores asociados a un usuario.
async function idsCuidadoresDe(usuarioId) {
  const { data } = await db.from('cuidadores').select('id').eq('usuario_id', usuarioId);
  return (data || []).map((c) => c.id);
}

/**
 * IDs de abuelos a los que puede acceder el usuario.
 * - admin: null (sin restricción)
 * - familiar: sus propios abuelos
 * - cuidador: abuelos con un servicio asignado a él
 */
async function abuelosPermitidos(usuario) {
  if (!usuario) return [];
  if (esAdmin(usuario)) return null;

  if (usuario.rol === 'familiar') {
    const { data } = await db.from('abuelos').select('id').eq('familiar_id', usuario.id);
    return (data || []).map((a) => a.id);
  }

  if (usuario.rol === 'cuidador') {
    const cuidadores = await idsCuidadoresDe(usuario.id);
    if (cuidadores.length === 0) return [];
    const { data } = await db
      .from('servicios')
      .select('abuelo_id')
      .in('cuidador_id', cuidadores);
    return [...new Set((data || []).map((s) => s.abuelo_id))];
  }

  return [];
}

function permiteAbuelo(permitidos, abueloId) {
  if (permitidos === null) return true;
  return permitidos.some((id) => igual(id, abueloId));
}

async function puedeVerAbuelo(usuario, abueloId) {
  return permiteAbuelo(await abuelosPermitidos(usuario), abueloId);
}

// Aplica el filtro de abuelos permitidos a una query de Supabase.
// Devuelve null cuando el usuario no tiene acceso a ningún abuelo.
function filtrarPorAbuelos(query, permitidos) {
  if (permitidos === null) return query;
  if (permitidos.length === 0) return null;
  return query.in('abuelo_id', permitidos);
}

function soloCampos(objeto, campos) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([clave]) => campos.includes(clave))
  );
}

module.exports = {
  esAdmin,
  igual,
  idsCuidadoresDe,
  abuelosPermitidos,
  permiteAbuelo,
  puedeVerAbuelo,
  filtrarPorAbuelos,
  soloCampos,
};
