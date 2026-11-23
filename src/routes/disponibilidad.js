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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cuidador_id, dia_semana, hora_inicio, hora_fin]
 *             properties:
 *               cuidador_id:
 *                 type: integer
 *                 example: 3
 *               dia_semana:
 *                 type: integer
 *                 enum: [0, 1, 2, 3, 4, 5, 6]
 *                 example: 1
 *               hora_inicio:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "08:00"
 *               hora_fin:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "14:00"
 *     responses:
 *       201:
 *         description: Disponibilidad creada
 *       400:
 *         description: Error de validación
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dia_semana:
 *                 type: integer
 *                 enum: [0, 1, 2, 3, 4, 5, 6]
 *                 description: "0 = domingo ... 6 = sábado"
 *                 example: 1
 *               hora_inicio:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "08:00"
 *               hora_fin:
 *                 type: string
 *                 pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "14:00"
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
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
