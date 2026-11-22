const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  subirDocumentos,
  revisar,
  listarPendientes,
} = require('../controllers/verificacionController');
const { autenticar } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/verificacion/subir-documentos:
 *   post:
 *     summary: Subir INE y selfie para verificación
 *     tags: [Verificación]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [cuidador_id, archivo_ine, archivo_selfie]
 *             properties:
 *               cuidador_id: { type: integer }
 *               archivo_ine: { type: string, format: binary }
 *               archivo_selfie: { type: string, format: binary }
 */
router.post('/subir-documentos', autenticar, upload.fields([
  { name: 'archivo_ine', maxCount: 1 },
  { name: 'archivo_selfie', maxCount: 1 },
]), subirDocumentos);

/**
 * @swagger
 * /api/verificacion/revisar:
 *   post:
 *     summary: Aprobar o rechazar verificación
 *     tags: [Verificación]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/revisar', autenticar, revisar);

/**
 * @swagger
 * /api/verificacion/pendientes:
 *   get:
 *     summary: Listar verificaciones pendientes
 *     tags: [Verificación]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/pendientes', autenticar, listarPendientes);

module.exports = router;
