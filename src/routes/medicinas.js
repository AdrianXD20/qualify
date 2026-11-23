const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/medicinasController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/medicinas:
 *   get:
 *     summary: Listar medicinas
 *     tags: [Medicinas]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/medicinas/{id}:
 *   get:
 *     summary: Obtener medicina por ID
 *     tags: [Medicinas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/medicinas:
 *   post:
 *     summary: Registrar medicina
 *     tags: [Medicinas]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [abuelo_id, nombre]
 *             properties:
 *               abuelo_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Metformina
 *               dosis:
 *                 type: string
 *                 example: "500 mg"
 *               horario:
 *                 type: string
 *                 example: "8:00 AM y 8:00 PM"
 *     responses:
 *       201:
 *         description: Medicina registrada
 *       400:
 *         description: Error de validación
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/medicinas/{id}:
 *   put:
 *     summary: Actualizar medicina
 *     tags: [Medicinas]
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
 *               nombre:
 *                 type: string
 *                 example: Metformina
 *               dosis:
 *                 type: string
 *                 example: "500 mg"
 *               horario:
 *                 type: string
 *                 example: "8:00 AM y 8:00 PM"
 *     responses:
 *       200:
 *         description: Medicina actualizada
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/medicinas/{id}:
 *   delete:
 *     summary: Eliminar medicina
 *     tags: [Medicinas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
