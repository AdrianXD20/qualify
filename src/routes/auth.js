const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Inicio de sesión y perfil del usuario autenticado
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión (obtener token JWT)
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, password]
 *             properties:
 *               correo:
 *                 type: string
 *                 example: maria@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MiPass123
 *     responses:
 *       200:
 *         description: Sesión iniciada. Usar el `token` en el header Authorization de las demás rutas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [mensaje, token, usuario]
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Inicio de sesión exitoso
 *                 token:
 *                   type: string
 *                   description: JWT con el ID, rol y correo del usuario. Expira en 1 hora.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     rol:
 *                       type: string
 *                       example: cuidador
 *                     nombre:
 *                       type: string
 *                       example: María López
 *                     correo:
 *                       type: string
 *                       format: email
 *                       example: maria@email.com
 *                     telefono:
 *                       type: string
 *                       nullable: true
 *                       example: "9991234567"
 *       401:
 *         description: Credenciales incorrectas
 *       400:
 *         description: Correo y contraseña son requeridos
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Autenticación]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: No autorizado
 */
router.get('/me', autenticar, me);

module.exports = router;
