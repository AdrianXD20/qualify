const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/serviciosController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/servicios:
 *   get:
 *     summary: Listar servicios
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/servicios/{id}:
 *   get:
 *     summary: Obtener servicio por ID
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/servicios:
 *   post:
 *     summary: Crear servicio (requiere cuidador verificado)
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/servicios/{id}:
 *   put:
 *     summary: Actualizar servicio
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/servicios/{id}:
 *   delete:
 *     summary: Eliminar servicio
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
