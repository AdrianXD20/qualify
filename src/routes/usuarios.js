const express = require('express');
const router = express.Router();
const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/usuariosController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
