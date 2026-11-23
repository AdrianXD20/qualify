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
 *     description: >
 *       Debe incluir al menos abuelo_id o cuidador_id. Para el seguimiento
 *       durante un servicio usa /api/ubicaciones/tiempo-real.
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
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Opcional; por defecto la fecha actual
 *                 example: "2026-01-15T08:00:00Z"
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
 *     description: >
 *       Incluye direccion_formateada, obtenida con el mismo geocodificador que
 *       usan las geocercas y el mapa de cuidadores libres (cacheada 24 h).
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
 *     description: Solo se actualizan las coordenadas y datos de movimiento; no se puede cambiar el abuelo ni el cuidador.
 *     tags: [Ubicaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitud:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 19.4326
 *               longitud:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -99.1332
 *               velocidad:
 *                 type: number
 *                 example: 12
 *               direccion_grados:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *                 example: 45
 *               precision_metros:
 *                 type: number
 *                 example: 10
 *               bateria:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *     responses:
 *       200:
 *         description: Ubicación actualizada
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
