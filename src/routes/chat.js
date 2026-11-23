const express = require('express');
const router = express.Router();
const {
  contextoChat, listar, enviar, marcarLeidos,
} = require('../controllers/mensajesController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: >
 *     Mensajes entre el familiar y el cuidador de una cita. El chat solo se
 *     habilita cuando ambas partes aceptaron el servicio. En tiempo real por
 *     Socket.io (sala `chat_servicio_{id}`; eventos `mensaje_nuevo`,
 *     `mensajes_leidos` y `chat_habilitado`).
 */

/**
 * @swagger
 * /api/servicios/{id}/chat:
 *   get:
 *     summary: Estado del chat de una cita
 *     description: >
 *       Indica si el chat está habilitado, quién falta por aceptar, los datos
 *       de las dos partes y cuántos mensajes sin leer tiene el usuario.
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del servicio (cita)
 *         schema: { type: integer }
 *         example: 12
 *     responses:
 *       200:
 *         description: Estado del chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 servicio_id: { type: integer, example: 12 }
 *                 habilitado: { type: boolean, example: false }
 *                 estado: { type: string, example: activo }
 *                 aceptado_por_familiar: { type: boolean, example: true }
 *                 aceptado_por_cuidador: { type: boolean, example: false }
 *                 motivo:
 *                   type: string
 *                   nullable: true
 *                   example: El chat se habilita cuando el cuidador acepta la cita
 *                 participantes:
 *                   type: object
 *                   properties:
 *                     familiar:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 6 }
 *                         nombre: { type: string, example: María González }
 *                         rol: { type: string, example: familiar }
 *                     cuidador:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 1 }
 *                         nombre: { type: string, example: Juan Pérez }
 *                         rol: { type: string, example: cuidador }
 *                 no_leidos: { type: integer, example: 3 }
 *       403:
 *         description: No participas en este servicio
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id/chat', autenticar, contextoChat);

/**
 * @swagger
 * /api/servicios/{id}/mensajes:
 *   get:
 *     summary: Listar mensajes del chat
 *     description: >
 *       Devuelve los mensajes en orden cronológico. Usa `antes_de_id` para
 *       cargar mensajes más antiguos (scroll hacia arriba).
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del servicio (cita)
 *         schema: { type: integer }
 *         example: 12
 *       - in: query
 *         name: limite
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *         example: 50
 *       - in: query
 *         name: antes_de_id
 *         description: Devuelve solo mensajes con ID menor (paginación hacia atrás)
 *         schema: { type: integer }
 *         example: 120
 *     responses:
 *       200:
 *         description: Mensajes del servicio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer, example: 121 }
 *                   servicio_id: { type: integer, example: 12 }
 *                   emisor_id: { type: integer, example: 6 }
 *                   contenido: { type: string, example: "¿A qué hora llegas mañana?" }
 *                   creado_en: { type: string, format: date-time }
 *                   leido_en: { type: string, format: date-time, nullable: true }
 *       403:
 *         description: El chat aún no está habilitado o no participas en el servicio
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id/mensajes', autenticar, listar);

/**
 * @swagger
 * /api/servicios/{id}/mensajes:
 *   post:
 *     summary: Enviar un mensaje
 *     description: >
 *       Solo disponible cuando el cuidador ya aceptó la cita. El mensaje se
 *       entrega en vivo a la otra parte por Socket.io (`mensaje_nuevo`).
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del servicio (cita)
 *         schema: { type: integer }
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: Hola, ¿a qué hora te parece si llegamos?
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *       400:
 *         description: Mensaje vacío o demasiado largo
 *       403:
 *         description: El chat aún no está habilitado o no participas en el servicio
 */
router.post('/:id/mensajes', autenticar, enviar);

/**
 * @swagger
 * /api/servicios/{id}/mensajes/leidos:
 *   put:
 *     summary: Marcar como leídos los mensajes de la otra parte
 *     description: >
 *       Marca como leídos todos los mensajes del servicio que no escribió el
 *       usuario. Emite `mensajes_leidos` por Socket.io.
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del servicio (cita)
 *         schema: { type: integer }
 *         example: 12
 *     responses:
 *       200:
 *         description: Mensajes marcados como leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 actualizados: { type: integer, example: 4 }
 */
router.put('/:id/mensajes/leidos', autenticar, marcarLeidos);

module.exports = router;
