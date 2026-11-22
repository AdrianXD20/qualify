const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/abuelosController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/abuelos:
 *   get:
 *     summary: Listar abuelos
 *     tags: [Abuelos]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/abuelos/{id}:
 *   get:
 *     summary: Obtener abuelo por ID
 *     tags: [Abuelos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/abuelos:
 *   post:
 *     summary: Registrar abuelo
 *     tags: [Abuelos]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/abuelos/{id}:
 *   put:
 *     summary: Actualizar abuelo
 *     tags: [Abuelos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/abuelos/{id}:
 *   delete:
 *     summary: Eliminar abuelo
 *     tags: [Abuelos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
