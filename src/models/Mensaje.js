const Joi = require('joi');

const esquemaMensaje = Joi.object({
  contenido: Joi.string().trim().min(1).max(2000).required(),
});

module.exports = { esquemaMensaje };
