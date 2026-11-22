const Joi = require('joi');

const esquemaCuidador = Joi.object({
  usuario_id: Joi.number().integer().positive().required(),
  cedula: Joi.string().optional().allow(null, ''),
  titulo: Joi.string().optional().allow(''),
  rfc: Joi.string().optional().allow(''),
  verificado: Joi.boolean().optional(),
  descripcion: Joi.string().optional().allow(''),
  anios_experiencia: Joi.number().integer().min(0).optional(),
  tarifa_hora: Joi.number().precision(2).positive().optional(),
  especialidades: Joi.string().optional().allow(''),
});

module.exports = { esquemaCuidador };
