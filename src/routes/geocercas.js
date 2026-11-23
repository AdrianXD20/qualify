const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/geocercasController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/geocercas:
 *   get:
 *     summary: Listar geocercas (zonas seguras)
 *     tags: [Geocercas]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/geocercas/{id}:
 *   get:
 *     summary: Obtener geocerca por ID
 *     tags: [Geocercas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/geocercas:
 *   post:
 *     summary: Crear geocerca (zona segura tipo Life360)
 *     tags: [Geocercas]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [abuelo_id, nombre, latitud, longitud]
 *             properties:
 *               abuelo_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Casa de abuelo
 *               latitud:
 *                 type: number
 *                 example: 19.4326
 *               longitud:
 *                 type: number
 *                 example: -99.1332
 *               radio_metros:
 *                 type: integer
 *                 example: 100
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Geocerca creada
 *       400:
 *         description: Error de validación
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/geocercas/{id}:
 *   put:
 *     summary: Actualizar geocerca
 *     tags: [Geocercas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/geocercas/{id}:
 *   delete:
 *     summary: Eliminar geocerca
 *     tags: [Geocercas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
