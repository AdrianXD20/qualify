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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [familiar_id, nombre]
 *             properties:
 *               familiar_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Don Juan Pérez
 *               nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1945-05-20"
 *               condiciones:
 *                 type: string
 *                 example: Diabetes, hipertensión
 *               notas:
 *                 type: string
 *                 example: Le gusta caminar por las mañanas
 *     responses:
 *       201:
 *         description: Abuelo registrado
 *       400:
 *         description: Error de validación
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
