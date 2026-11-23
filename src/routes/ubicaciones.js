const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, tiempoReal, actualizar, eliminar, ultimaPorAbuelo,
} = require('../controllers/ubicacionesController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/ubicaciones:
 *   get:
 *     summary: Listar ubicaciones
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   get:
 *     summary: Obtener ubicación por ID
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/ubicaciones:
 *   post:
 *     summary: Guardar ubicación (REST)
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitud, longitud]
 *             properties:
 *               abuelo_id:
 *                 type: integer
 *                 example: 1
 *               cuidador_id:
 *                 type: integer
 *                 example: 3
 *               latitud:
 *                 type: number
 *                 example: 19.4326
 *               longitud:
 *                 type: number
 *                 example: -99.1332
 *               velocidad:
 *                 type: number
 *                 example: 12
 *               direccion_grados:
 *                 type: number
 *                 example: 45
 *               precision_metros:
 *                 type: number
 *                 example: 10
 *               bateria:
 *                 type: integer
 *                 example: 85
 *     responses:
 *       201:
 *         description: Ubicación guardada
 *       400:
 *         description: Error de validación
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/ubicaciones/tiempo-real:
 *   post:
 *     summary: Recibir ubicación en tiempo real del cuidador (tipo Life360)
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cuidador_id, abuelo_id, latitud, longitud]
 *             properties:
 *               cuidador_id:
 *                 type: integer
 *                 example: 3
 *               abuelo_id:
 *                 type: integer
 *                 example: 1
 *               latitud:
 *                 type: number
 *                 example: 19.4326
 *               longitud:
 *                 type: number
 *                 example: -99.1332
 *               velocidad:
 *                 type: number
 *                 example: 12
 *               direccion_grados:
 *                 type: number
 *                 example: 45
 *               precision_metros:
 *                 type: number
 *                 example: 10
 *               bateria:
 *                 type: integer
 *                 example: 85
 *     responses:
 *       201:
 *         description: Ubicación guardada y emitida por Socket.io
 *       400:
 *         description: Error de validación
 */
router.post('/tiempo-real', autenticar, (req, res) => {
  const io = req.app.get('io');
  const controller = require('../controllers/ubicacionesController');
  controller.tiempoReal(req, res, io);
});

/**
 * @swagger
 * /api/ubicaciones/ultima/{abuelo_id}:
 *   get:
 *     summary: Última ubicación conocida de un abuelo
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: abuelo_id
 *         required: true
 */
router.get('/ultima/:abuelo_id', autenticar, ultimaPorAbuelo);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   put:
 *     summary: Actualizar ubicación
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   delete:
 *     summary: Eliminar ubicación
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
