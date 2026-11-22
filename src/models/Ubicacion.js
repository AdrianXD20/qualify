const Joi = require('joi');

const esquemaUbicacion = Joi.object({
  abuelo_id: Joi.number().integer().positive().optional(),
  cuidador_id: Joi.number().integer().positive().optional(),
  latitud: Joi.number().required(),
  longitud: Joi.number().required(),
  velocidad: Joi.number().optional(),
  direccion_grados: Joi.number().min(0).max(360).optional(),
  precision_metros: Joi.number().optional(),
  bateria: Joi.number().integer().min(0).max(100).optional(),
  fecha: Joi.date().optional(),
}).custom((value, helpers) => {
  if (!value.abuelo_id && !value.cuidador_id) {
    return helpers.error('any.required', { message: 'Debe incluir al menos abuelo_id o cuidador_id' });
  }
  return value;
});

const esquemaTiempoReal = Joi.object({
  abuelo_id: Joi.number().integer().positive().optional(),
  cuidador_id: Joi.number().integer().positive().required(),
  latitud: Joi.number().required(),
  longitud: Joi.number().required(),
  velocidad: Joi.number().optional(),
  direccion_grados: Joi.number().min(0).max(360).optional(),
  precision_metros: Joi.number().optional(),
  bateria: Joi.number().integer().min(0).max(100).optional(),
}).custom((value, helpers) => {
  if (!value.abuelo_id) {
    return helpers.error('any.required', { message: 'Para tiempo real se requiere abuelo_id' });
  }
  return value;
});

module.exports = { esquemaUbicacion, esquemaTiempoReal };
