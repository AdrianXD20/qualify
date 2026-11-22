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
