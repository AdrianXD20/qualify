const Joi = require('joi');

const esquemaUsuario = Joi.object({
  rol: Joi.string().valid('familiar', 'cuidador').required(),
  nombre: Joi.string().min(2).max(100).required(),
  correo: Joi.string().email().required(),
  telefono: Joi.string().optional().allow(''),
  password: Joi.string().min(6).required(),
});

const esquemaLogin = Joi.object({
  correo: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { esquemaUsuario, esquemaLogin };
