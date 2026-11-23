const express = require('express');
const router = express.Router();
const { reversa, buscar } = require('../controllers/geocodificacionController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/geocodificacion/reversa:
 *   get:
 *     summary: Obtener la dirección a partir de coordenadas
 *     description: >
 *       Geocodificación inversa con OpenStreetMap/Nominatim (gratuita). Sirve
 *       para cualquier punto: zona segura, cuidador libre o seguimiento del
 *       paciente. Las respuestas se cachean 24 h y se respeta el límite de
 *       1 petición por segundo del proveedor.
 *     tags: [Geocodificación]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: latitud
 *         required: true
 *         schema: { type: number, minimum: -90, maximum: 90 }
 *         example: 20.9674
 *       - in: query
 *         name: longitud
 *         required: true
 *         schema: { type: number, minimum: -180, maximum: 180 }
 *         example: -89.5926
 *     responses:
 *       200:
 *         description: Dirección encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 latitud: { type: number, example: 20.9674 }
 *                 longitud: { type: number, example: -89.5926 }
 *                 calle_numero: { type: string, example: "Calle 57 A 123" }
 *                 colonia: { type: string, example: Centro }
 *                 codigo_postal: { type: string, example: "97000" }
 *                 ciudad: { type: string, example: Mérida }
 *                 estado: { type: string, example: Yucatán }
 *                 pais: { type: string, example: México }
 *                 direccion_formateada: { type: string, example: "Calle 57 A, Centro, Mérida, Yucatán, 97000, México" }
 *       404:
 *         description: No se encontró una dirección
 */
router.get('/reversa', autenticar, reversa);

/**
 * @swagger
 * /api/geocodificacion/buscar:
 *   get:
 *     summary: Obtener coordenadas a partir de una dirección por partes
 *     description: >
 *       Geocodificación directa. Envía al menos uno de los campos; mientras más
 *       campos envíes, más exacto será el resultado. Devuelve también la
 *       dirección normalizada para guardarla junto con la geocerca.
 *     tags: [Geocodificación]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: calle_numero
 *         schema: { type: string }
 *         example: Calle 60 123
 *       - in: query
 *         name: colonia
 *         schema: { type: string }
 *         example: Centro
 *       - in: query
 *         name: codigo_postal
 *         schema: { type: string }
 *         example: "97000"
 *       - in: query
 *         name: ciudad
 *         schema: { type: string }
 *         example: Mérida
 *       - in: query
 *         name: estado
 *         schema: { type: string }
 *         example: Yucatán
 *       - in: query
 *         name: pais
 *         schema: { type: string, default: México }
 *         example: México
 *     responses:
 *       200:
 *         description: Coordenadas encontradas
 *       400:
 *         description: Faltan datos de la dirección
 *       404:
 *         description: No se encontró la dirección
 */
router.get('/buscar', autenticar, buscar);

module.exports = router;
