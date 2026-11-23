// Geocodificación gratuita con OpenStreetMap/Nominatim.
// Política de uso: máximo ~1 petición por segundo, identificar la app y cachear.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'QualifyMVP/1.0 (+https://qualify-mo00.onrender.com)';
const INTERVALO_MIN_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

const cache = new Map();
let cola = Promise.resolve();
let ultimaConsulta = 0;

function leerCache(clave) {
  const entrada = cache.get(clave);
  if (!entrada) return null;
  if (Date.now() - entrada.creado > CACHE_TTL_MS) {
    cache.delete(clave);
    return null;
  }
  return entrada.valor;
}

function guardarCache(clave, valor) {
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(clave, { valor, creado: Date.now() });
}

// Serializa las llamadas para no superar 1 req/s.
function enCola(tarea) {
  const turno = cola.then(async () => {
    const espera = Math.max(0, INTERVALO_MIN_MS - (Date.now() - ultimaConsulta));
    if (espera > 0) await new Promise((resolve) => setTimeout(resolve, espera));
    ultimaConsulta = Date.now();
    return tarea();
  });
  cola = turno.then(
    () => {},
    () => {}
  );
  return turno;
}

async function consultarNomimatim(ruta, parametros) {
  const url = new URL(NOMINATIM_URL + ruta);
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(clave, valor);
    }
  }

  const respuesta = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      'Accept-Language': 'es',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!respuesta.ok) {
    throw new Error(`Nominatim respondió ${respuesta.status}`);
  }

  return respuesta.json();
}

function normalizarDireccion(address = {}, displayName) {
  const calle = [address.road, address.house_number].filter(Boolean).join(' ');

  return {
    calle_numero: calle || null,
    colonia:
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      null,
    codigo_postal: address.postcode || null,
    ciudad:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      null,
    estado: address.state || address.region || null,
    pais: address.country || null,
    direccion_formateada: displayName || null,
  };
}

// Coordenadas -> dirección
async function geocodificarInversa(latitud, longitud) {
  const clave = `rev:${Number(latitud).toFixed(5)},${Number(longitud).toFixed(5)}`;
  const enCache = leerCache(clave);
  if (enCache) return enCache;

  const datos = await enCola(() =>
    consultarNomimatim('/reverse', {
      format: 'jsonv2',
      lat: latitud,
      lon: longitud,
      addressdetails: 1,
      zoom: 18,
      'accept-language': 'es',
    })
  );

  if (!datos || datos.error) {
    return null;
  }

  const resultado = {
    latitud: Number(datos.lat),
    longitud: Number(datos.lon),
    ...normalizarDireccion(datos.address, datos.display_name),
  };

  guardarCache(clave, resultado);
  return resultado;
}

// Dirección por partes -> coordenadas
async function geocodificarDireccion(partes) {
  const consulta = [
    partes.calle_numero,
    partes.colonia,
    partes.codigo_postal,
    partes.ciudad,
    partes.estado,
    partes.pais || 'México',
  ]
    .map((parte) => (typeof parte === 'string' ? parte.trim() : parte))
    .filter(Boolean)
    .join(', ');

  if (!consulta) return null;

  const clave = `fwd:${consulta.toLowerCase()}`;
  const enCache = leerCache(clave);
  if (enCache) return enCache;

  const resultados = await enCola(() =>
    consultarNomimatim('/search', {
      format: 'jsonv2',
      addressdetails: 1,
      limit: 1,
      q: consulta,
      'accept-language': 'es',
    })
  );

  if (!Array.isArray(resultados) || resultados.length === 0) {
    return null;
  }

  const primero = resultados[0];
  const resultado = {
    latitud: Number(primero.lat),
    longitud: Number(primero.lon),
    ...normalizarDireccion(primero.address, primero.display_name),
  };

  guardarCache(clave, resultado);
  return resultado;
}

module.exports = { geocodificarInversa, geocodificarDireccion };
