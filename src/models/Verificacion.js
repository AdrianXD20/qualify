const Joi = require('joi');

const esquemaSubirDocumentos = Joi.object({
  cuidador_id: Joi.number().integer().positive().required(),
});

const esquemaRevisar = Joi.object({
  verificacion_id: Joi.number().integer().positive().required(),
  estado: Joi.string().valid('aprobado', 'rechazado').required(),
  motivo_rechazo: Joi.string().optional().allow(''),
});

module.exports = { esquemaSubirDocumentos, esquemaRevisar };
