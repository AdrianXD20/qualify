const Joi = require('joi');

const esquemaMedicina = Joi.object({
  abuelo_id: Joi.number().integer().positive().required(),
  nombre: Joi.string().min(2).max(100).required(),
  dosis: Joi.string().optional().allow(''),
  horario: Joi.string().optional().allow(''),
});

module.exports = { esquemaMedicina };
