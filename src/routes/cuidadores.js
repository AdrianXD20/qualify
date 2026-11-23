const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, eliminar,
} = require('../controllers/cuidadoresController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/cuidadores:
 *   get:
 *     summary: Listar cuidadores
 *     tags: [Cuidadores]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/cuidadores/{id}:
 *   get:
 *     summary: Obtener cuidador por ID
 *     tags: [Cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/cuidadores:
 *   post:
 *     summary: Crear cuidador
 *     tags: [Cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id]
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 5
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               titulo:
 *                 type: string
 *                 example: Geriatría
 *               rfc:
 *                 type: string
 *                 example: "GOPA900101ABC"
 *               verificado:
 *                 type: boolean
 *                 example: false
 *               descripcion:
 *                 type: string
 *                 example: Cuidador con experiencia en adultos mayores
 *               anios_experiencia:
 *                 type: integer
 *                 example: 5
 *               tarifa_hora:
 *                 type: number
 *                 example: 150
 *               especialidades:
 *                 type: string
 *                 example: Baño, alimentación, movilización
 *     responses:
 *       201:
 *         description: Cuidador creado
 *       400:
 *         description: Error de validación
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/cuidadores/{id}:
 *   put:
 *     summary: Actualizar cuidador
 *     tags: [Cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/cuidadores/{id}:
 *   delete:
 *     summary: Eliminar cuidador
 *     tags: [Cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
