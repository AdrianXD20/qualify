const express = require('express');
const router = express.Router();
const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  mapa,
  cambiarDisponible,
  reportarUbicacion,
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
 * /api/cuidadores/mapa:
 *   get:
 *     summary: Cuidadores libres en el mapa (ubicación aproximada ~200 m)
 *     description: >
 *       Devuelve únicamente cuidadores verificados que activaron "Estoy disponible",
 *       con una ubicación actualizada en los últimos 2 minutos y sin un servicio
 *       activo en este momento. Las coordenadas vienen redondeadas a ~200 m.
 *     tags: [Cuidadores libres]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de cuidadores disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cuidador_id: { type: integer, example: 3 }
 *                   nombre: { type: string, example: Ana López }
 *                   especialidades: { type: string, example: Baño, alimentación }
 *                   tarifa_hora: { type: number, example: 150 }
 *                   anios_experiencia: { type: integer, example: 5 }
 *                   latitud: { type: number, example: 19.432 }
 *                   longitud: { type: number, example: -99.133 }
 *                   precision_metros: { type: integer, example: 200 }
 *                   actualizado_en: { type: string, format: date-time }
 */
router.get('/mapa', autenticar, mapa);

/**
 * @swagger
 * /api/cuidadores/{id}/disponible:
 *   put:
 *     summary: Activar o desactivar la disponibilidad del cuidador
 *     description: >
 *       Solo el propio cuidador (o un admin) puede cambiarla. Al desactivarla
 *       se borra su ubicación pública y desaparece del mapa.
 *     tags: [Cuidadores libres]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [disponible]
 *             properties:
 *               disponible: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 *       403:
 *         description: Perfil no verificado o sin permisos
 */
router.put('/:id/disponible', autenticar, cambiarDisponible);

/**
 * @swagger
 * /api/cuidadores/{id}/ubicacion:
 *   put:
 *     summary: Reportar la ubicación del cuidador mientras está disponible
 *     description: >
 *       Requiere tener "disponible" activo y el perfil verificado. La ubicación
 *       se guarda redondeada a ~200 m y se emite por Socket.io al evento
 *       "ubicacion_cuidador_libre" en la sala "cuidadores_libres".
 *     tags: [Cuidadores libres]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitud, longitud]
 *             properties:
 *               latitud: { type: number, example: 19.4326 }
 *               longitud: { type: number, example: -99.1332 }
 *               precision_metros: { type: number, example: 10 }
 *     responses:
 *       200:
 *         description: Ubicación aproximada actualizada
 *       409:
 *         description: El cuidador no está disponible o tiene un servicio activo
 */
router.put('/:id/ubicacion', autenticar, reportarUbicacion);

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
 *     summary: Crear cuidador (registro público, no requiere token)
 *     tags: [Cuidadores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id]
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 description: ID del usuario registrado con rol "cuidador"
 *                 example: 5
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               titulo:
 *                 type: string
 *                 example: Geriatría
 *               rfc:
 *                 type: string
 *                 example: "GOPA900101ABC"
 *               verificado:
 *                 type: boolean
 *                 description: Solo un administrador puede establecerlo; el registro público lo fuerza a false
 *                 example: false
 *               descripcion:
 *                 type: string
 *                 example: Cuidador con experiencia en adultos mayores
 *               anios_experiencia:
 *                 type: integer
 *                 example: 5
 *               tarifa_hora:
 *                 type: number
 *                 example: 150
 *               especialidades:
 *                 type: string
 *                 example: Baño, alimentación, movilización
 *     responses:
 *       201:
 *         description: Cuidador creado
 *       400:
 *         description: Error de validación
 */
router.post('/', crear);

/**
 * @swagger
 * /api/cuidadores/{id}:
 *   put:
 *     summary: Actualizar cuidador
 *     description: >
 *       Actualización parcial del propio perfil. El campo verificado solo lo
 *       puede cambiar un administrador.
 *     tags: [Cuidadores]
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
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               titulo:
 *                 type: string
 *                 example: Geriatría
 *               rfc:
 *                 type: string
 *                 example: "GOPA900101ABC"
 *               descripcion:
 *                 type: string
 *                 example: Cuidador con experiencia en adultos mayores
 *               anios_experiencia:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *               tarifa_hora:
 *                 type: number
 *                 example: 150
 *               especialidades:
 *                 type: string
 *                 example: Baño, alimentación, movilización
 *               verificado:
 *                 type: boolean
 *                 description: Solo un administrador puede cambiarlo
 *     responses:
 *       200:
 *         description: Cuidador actualizado
 *       403:
 *         description: No puedes modificar este cuidador
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
