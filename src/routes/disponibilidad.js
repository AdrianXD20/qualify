const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/disponibilidadController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/disponibilidad:
 *   get:
 *     summary: Listar disponibilidad
 *     tags: [Disponibilidad]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/disponibilidad/{id}:
 *   get:
 *     summary: Obtener disponibilidad por ID
 *     tags: [Disponibilidad]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/disponibilidad:
 *   post:
 *     summary: Crear disponibilidad
 *     tags: [Disponibilidad]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/disponibilidad/{id}:
 *   put:
 *     summary: Actualizar disponibilidad
 *     tags: [Disponibilidad]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/disponibilidad/{id}:
 *   delete:
 *     summary: Eliminar disponibilidad
 *     tags: [Disponibilidad]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
