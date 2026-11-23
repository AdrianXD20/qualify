const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  subirDocumentos,
  revisar,
  listarPendientes,
} = require('../controllers/verificacionController');
const { autenticar, soloAdmin } = require('../middleware/auth');

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
 *               cuidador_id:
 *                 type: integer
 *                 example: 3
 *               archivo_ine:
 *                 type: string
 *                 format: binary
 *               archivo_selfie:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documentos subidos, en revisión manual
 *       400:
 *         description: Error de validación
 */
router.post('/subir-documentos', autenticar, upload.fields([
  { name: 'archivo_ine', maxCount: 1 },
  { name: 'archivo_selfie', maxCount: 1 },
]), subirDocumentos);

/**
 * @swagger
 * /api/verificacion/revisar:
 *   post:
 *     summary: Aprobar o rechazar verificación (solo administrador)
 *     tags: [Verificación]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificacion_id, estado]
 *             properties:
 *               verificacion_id:
 *                 type: integer
 *                 example: 1
 *               estado:
 *                 type: string
 *                 enum: [aprobado, rechazado]
 *                 example: aprobado
 *               motivo_rechazo:
 *                 type: string
 *                 example: Documentos incompletos
 *     responses:
 *       200:
 *         description: Revisión actualizada
 *       400:
 *         description: Error de validación
 */
router.post('/revisar', autenticar, soloAdmin, revisar);

/**
 * @swagger
 * /api/verificacion/pendientes:
 *   get:
 *     summary: Listar verificaciones pendientes
 *     tags: [Verificación]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/pendientes', autenticar, soloAdmin, listarPendientes);

module.exports = router;
