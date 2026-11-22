const Joi = require('joi');

const esquemaDisponibilidad = Joi.object({
  cuidador_id: Joi.number().integer().positive().required(),
  dia_semana: Joi.number().integer().min(0).max(6).required(),
  hora_inicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  hora_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
});

module.exports = { esquemaDisponibilidad };
