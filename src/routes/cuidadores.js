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
