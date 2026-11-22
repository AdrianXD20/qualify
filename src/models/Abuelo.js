const Joi = require('joi');

const esquemaAbuelo = Joi.object({
  familiar_id: Joi.number().integer().positive().required(),
  nombre: Joi.string().min(2).max(100).required(),
  nacimiento: Joi.date().optional(),
  condiciones: Joi.string().optional().allow(''),
  notas: Joi.string().optional().allow(''),
});

module.exports = { esquemaAbuelo };
