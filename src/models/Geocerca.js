const Joi = require('joi');

const esquemaGeocerca = Joi.object({
  abuelo_id: Joi.number().integer().positive().required(),
  nombre: Joi.string().min(2).max(100).required(),
  latitud: Joi.number().required(),
  longitud: Joi.number().required(),
  radio_metros: Joi.number().integer().positive().default(100),
  activo: Joi.boolean().optional(),
  calle_numero: Joi.string().max(150).optional().allow('', null),
  colonia: Joi.string().max(100).optional().allow('', null),
  codigo_postal: Joi.string().max(10).optional().allow('', null),
  ciudad: Joi.string().max(100).optional().allow('', null),
  estado: Joi.string().max(100).optional().allow('', null),
  pais: Joi.string().max(100).optional().allow('', null),
  direccion_formateada: Joi.string().max(500).optional().allow('', null),
});

module.exports = { esquemaGeocerca };
