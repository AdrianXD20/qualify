const { geocodificarInversa, geocodificarDireccion } = require('../services/geocodificacion');

// GET /api/geocodificacion/reversa?latitud=..&longitud=..
async function reversa(req, res) {
  const latitud = Number(req.query.latitud);
  const longitud = Number(req.query.longitud);

  if (
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    latitud < -90 ||
    latitud > 90 ||
    longitud < -180 ||
    longitud > 180
  ) {
    return res.status(400).json({
      error: 'latitud y longitud válidas son requeridas (lat -90..90, lng -180..180)',
    });
  }

  try {
    const direccion = await geocodificarInversa(latitud, longitud);

    if (!direccion) {
      return res.status(404).json({ error: 'No se encontró una dirección para esas coordenadas' });
    }

    res.json(direccion);
  } catch (err) {
    res.status(502).json({
      error: 'No se pudo consultar el geocodificador',
      detalle: err.message,
    });
  }
}

// GET /api/geocodificacion/buscar?calle_numero=..&colonia=..&codigo_postal=..&ciudad=..&estado=..
async function buscar(req, res) {
  const partes = {
    calle_numero: req.query.calle_numero,
    colonia: req.query.colonia,
    codigo_postal: req.query.codigo_postal,
    ciudad: req.query.ciudad,
    estado: req.query.estado,
    pais: req.query.pais,
  };

  const hayDatos = Object.values(partes).some(
    (valor) => typeof valor === 'string' && valor.trim() !== ''
  );

  if (!hayDatos) {
    return res.status(400).json({
      error: 'Envía al menos uno de: calle_numero, colonia, codigo_postal, ciudad, estado',
    });
  }

  try {
    const resultado = await geocodificarDireccion(partes);

    if (!resultado) {
      return res.status(404).json({ error: 'No se encontró la dirección' });
    }

    res.json(resultado);
  } catch (err) {
    res.status(502).json({
      error: 'No se pudo consultar el geocodificador',
      detalle: err.message,
    });
  }
}

module.exports = { reversa, buscar };
