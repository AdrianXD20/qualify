const express = require('express');
const router = express.Router();
const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/usuariosController');
const { autenticar } = require('../middleware/auth');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get('/', autenticar, listar);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', autenticar, obtener);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear usuario (registro público, no requiere token)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol, nombre, correo, password]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [familiar, cuidador]
 *                 example: familiar
 *               nombre:
 *                 type: string
 *                 example: María González
 *               correo:
 *                 type: string
 *                 example: maria@email.com
 *               telefono:
 *                 type: string
 *                 example: "5512345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MiPass123
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Error de validación
 */
router.post('/', crear);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: >
 *       Actualización parcial: envía solo los campos a cambiar. El rol solo
 *       puede modificarlo un administrador; la contraseña no se cambia aquí.
 *     tags: [Usuarios]
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
 *               nombre:
 *                 type: string
 *                 example: María González
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: maria@email.com
 *               telefono:
 *                 type: string
 *                 example: "5512345678"
 *               rol:
 *                 type: string
 *                 enum: [familiar, cuidador, admin]
 *                 description: Solo un administrador puede cambiarlo
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       403:
 *         description: No puedes modificar otro usuario
 */
router.put('/:id', autenticar, actualizar);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', autenticar, eliminar);

module.exports = router;
