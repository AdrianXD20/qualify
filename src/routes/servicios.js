const express = require('express');
const router = express.Router();
const {
  listar, obtener, crear, actualizar, aceptar, eliminar,
} = require('../controllers/serviciosController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/servicios:
 *   get:
 *     summary: Listar servicios
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/servicios/{id}:
 *   get:
 *     summary: Obtener servicio por ID
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/servicios:
 *   post:
 *     summary: Crear servicio (requiere cuidador verificado)
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [abuelo_id, cuidador_id]
 *             properties:
 *               abuelo_id:
 *                 type: integer
 *                 example: 1
 *               cuidador_id:
 *                 type: integer
 *                 example: 3
 *               nota:
 *                 type: string
 *                 example: Servicio de acompañamiento matutino
 *               inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-15T08:00:00Z"
 *               fin:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-15T10:00:00Z"
 *               tarifa_hora:
 *                 type: number
 *                 example: 150
 *               total:
 *                 type: number
 *                 example: 300
 *               comision:
 *                 type: number
 *                 example: 5
 *               estado:
 *                 type: string
 *                 enum: [activo, completado, cancelado]
 *                 example: activo
 *               estado_pago:
 *                 type: string
 *                 enum: [pendiente, pagado, liquidado]
 *                 example: pendiente
 *     responses:
 *       201:
 *         description: Servicio creado
 *       400:
 *         description: Error de validación
 *       403:
 *         description: Cuidador no verificado
 */
router.post('/', autenticar, crear);

/**
 * @swagger
 * /api/servicios/{id}:
 *   put:
 *     summary: Actualizar servicio
 *     description: >
 *       Actualización parcial. Si el estado queda en "activo", el cuidador se
 *       marca como ocupado y desaparece del mapa de cuidadores libres.
 *     tags: [Servicios]
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
 *               nota:
 *                 type: string
 *                 example: Servicio de acompañamiento matutino
 *               inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-15T08:00:00Z"
 *               fin:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-15T10:00:00Z"
 *               tarifa_hora:
 *                 type: number
 *                 example: 150
 *               total:
 *                 type: number
 *                 example: 300
 *               comision:
 *                 type: number
 *                 example: 5
 *               estado:
 *                 type: string
 *                 enum: [activo, completado, cancelado]
 *                 example: activo
 *               estado_pago:
 *                 type: string
 *                 enum: [pendiente, pagado, liquidado]
 *                 example: pendiente
 *     responses:
 *       200:
 *         description: Servicio actualizado
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/servicios/{id}/aceptar:
 *   put:
 *     summary: Aceptar una cita (familiar o cuidador)
 *     description: >
 *       El familiar que crea el servicio ya cuenta como aceptante. El cuidador
 *       debe aceptar con este endpoint. Cuando ambas partes aceptaron se
 *       habilita el chat del servicio. No se puede aceptar una cita cancelada
 *       o completada.
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 12
 *     responses:
 *       200:
 *         description: Cita aceptada. Devuelve también `chat_habilitado`.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Servicio'
 *                 - type: object
 *                   properties:
 *                     chat_habilitado: { type: boolean, example: true }
 *       400:
 *         description: El servicio ya está cerrado
 *       403:
 *         description: No participas en este servicio
 *       404:
 *         description: Servicio no encontrado
 */
router.put('/:id/aceptar', autenticar, aceptar);

/**
 * @swagger
 * /api/servicios/{id}:
 *   delete:
 *     summary: Eliminar servicio
 *     tags: [Servicios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
