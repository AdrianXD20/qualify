const express = require('express');
const router = express.Router();
const {
  listar,
  obtener,
  abrir,
  listarMensajes,
  enviar,
  marcarLeidos,
} = require('../controllers/consultasCuidadoresController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Consultas a cuidadores
 *   description: Conversaciones privadas entre familiares y cuidadores antes de contratar.
 */

/**
 * @swagger
 * /api/consultas:
 *   get:
 *     summary: Listar mis conversaciones con cuidadores
 *     description: Devuelve únicamente las consultas en las que participa el usuario autenticado.
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conversaciones del familiar o cuidador autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConsultaCuidador'
 *       403:
 *         description: Solo familiares y cuidadores pueden consultar chats
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/consultas/cuidadores/{cuidador_id}:
 *   post:
 *     summary: Iniciar o recuperar una conversación con un cuidador disponible
 *     description: >
 *       Solo un familiar puede iniciar la consulta. Si ya existe una conversación
 *       con ese cuidador, devuelve la misma para conservar el historial.
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: cuidador_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         example: 3
 *     responses:
 *       200:
 *         description: Conversación iniciada o recuperada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConsultaCuidador'
 *       403:
 *         description: Solo un familiar puede iniciar la conversación
 *       409:
 *         description: El cuidador ya no está disponible
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 */
router.post('/cuidadores/:cuidador_id', autenticar, abrir);

/**
 * @swagger
 * /api/consultas/{id}:
 *   get:
 *     summary: Obtener los datos y el estado de una conversación
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         example: 10
 *     responses:
 *       200:
 *         description: Datos de la conversación y cantidad de mensajes sin leer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConsultaCuidador'
 *       403:
 *         description: No participas en esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/consultas/{id}/mensajes:
 *   get:
 *     summary: Listar mensajes de una consulta
 *     description: Devuelve mensajes en orden cronológico; permite paginar hacia atrás.
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - in: query
 *         name: antes_de_id
 *         description: Devuelve mensajes con un ID menor para cargar historial anterior.
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Mensajes de la conversación
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MensajeConsulta'
 *       403:
 *         description: No participas en esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 *   post:
 *     summary: Enviar un mensaje a la conversación
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
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
 *                 example: Hola, ¿tienes disponibilidad para acompañar a mi papá?
 *     responses:
 *       201:
 *         description: Mensaje enviado y emitido por Socket.io
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensajeConsulta'
 *       400:
 *         description: Mensaje vacío o demasiado largo
 *       403:
 *         description: No participas en esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 */
router.get('/:id/mensajes', autenticar, listarMensajes);
router.post('/:id/mensajes', autenticar, enviar);

/**
 * @swagger
 * /api/consultas/{id}/mensajes/leidos:
 *   put:
 *     summary: Marcar como leídos los mensajes recibidos
 *     tags: [Consultas a cuidadores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Cantidad de mensajes marcados como leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 actualizados: { type: integer, example: 2 }
 *       403:
 *         description: No participas en esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       503:
 *         description: Falta aplicar la migración 004 en Supabase
 */
router.put('/:id/mensajes/leidos', autenticar, marcarLeidos);

module.exports = router;
