const Joi = require('joi');

const esquemaGeocerca = Joi.object({
  abuelo_id: Joi.number().integer().positive().required(),
  nombre: Joi.string().min(2).max(100).required(),
  latitud: Joi.number().required(),
  longitud: Joi.number().required(),
  radio_metros: Joi.number().integer().positive().default(100),
  activo: Joi.boolean().optional(),
});

module.exports = { esquemaGeocerca };
