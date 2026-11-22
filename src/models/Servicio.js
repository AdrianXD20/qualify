const Joi = require('joi');

const esquemaServicio = Joi.object({
  abuelo_id: Joi.number().integer().positive().required(),
  cuidador_id: Joi.number().integer().positive().required(),
  nota: Joi.string().optional().allow(''),
  inicio: Joi.date().optional(),
  fin: Joi.date().optional(),
  tarifa_hora: Joi.number().precision(2).positive().optional(),
  total: Joi.number().precision(2).optional(),
  comision: Joi.number().precision(2).optional(),
  estado: Joi.string().valid('activo', 'completado', 'cancelado').optional(),
  estado_pago: Joi.string().valid('pendiente', 'pagado', 'liquidado').optional(),
});

module.exports = { esquemaServicio };
