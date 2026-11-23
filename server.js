require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ============================================
// SEGURIDAD Y MIDDLEWARES GLOBALES
// ============================================

app.use(helmet());

// Content Security Policy para permitir que Swagger se conecte a la API
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'",
      'https://qualify-mo00.onrender.com',
      'http://localhost:3000',
    ],
  },
}));

app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ============================================
// TEMPORALMENTE SIN RATE LIMITING (para pruebas)
// TODO: Agregar de nuevo antes de producción
// ============================================
// const limiter = rateLimit({...});
// app.use(limiter);
// const authLimiter = rateLimit({...});
// app.use('/api/auth/login', authLimiter);
// app.use('/api/usuarios', authLimiter);

// ============================================
// CORS: localhost y Render
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'https://qualify-mo00.onrender.com',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('No permitido por CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ============================================
// SOCKET.IO PARA TIEMPO REAL
// ============================================
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error('No permitido por CORS'), false);
    },
    methods: ['GET', 'POST'],
  },
});

// ============================================
// SWAGGER (Render por defecto)
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qualify API',
      version: '1.0.0',
      description: 'API REST para app de cuidado de adultos mayores (MVP tipo Life360)',
      contact: { name: 'Qualify Team' },
    },
    servers: [
      { url: 'https://qualify-mo00.onrender.com', description: 'Producción en Render' },
      { url: `http://localhost:${PORT}`, description: 'Servidor local de desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT generado por POST /api/auth/login (Bearer <token>)',
        },
      },
    },
    tags: [
      { name: 'Autenticación', description: 'Registro, login y perfil de la sesión' },
      { name: 'Usuarios', description: 'Cuentas de familiares y cuidadores' },
      { name: 'Abuelos', description: 'Adultos mayores registrados por un familiar' },
      { name: 'Cuidadores', description: 'Perfiles de cuidadores' },
      {
        name: 'Cuidadores libres',
        description:
          'Mapa en tiempo real de cuidadores disponibles: disponibilidad, ubicación aproximada (~200 m) y listado de libres',
      },
      { name: 'Servicios', description: 'Contratación y seguimiento de servicios' },
      {
        name: 'Chat',
        description:
          'Mensajes entre familiar y cuidador, habilitados solo cuando ambos aceptaron la cita',
      },
      {
        name: 'Consultas a cuidadores',
        description: 'Conversaciones privadas entre familiares y cuidadores disponibles antes de contratar',
      },
      { name: 'Ubicaciones', description: 'Seguimiento GPS durante un servicio' },
      { name: 'Medicinas', description: 'Medicamentos por abuelo' },
      { name: 'Geocercas', description: 'Zonas seguras y alertas de salida' },
      {
        name: 'Geocodificación',
        description:
          'Dirección a partir de coordenadas y coordenadas a partir de una dirección (OpenStreetMap/Nominatim)',
      },
      { name: 'Disponibilidad', description: 'Horarios semanales del cuidador' },
      { name: 'Verificación', description: 'Validación manual de identidad' },
    ],
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

swaggerDocs.components.schemas = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string', example: 'Recurso no encontrado' },
      detalle: { type: 'string', nullable: true },
    },
  },
  MensajeRespuesta: {
    type: 'object',
    required: ['mensaje'],
    properties: { mensaje: { type: 'string', example: 'Operación completada' } },
  },
  Usuario: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      rol: { type: 'string', enum: ['familiar', 'cuidador', 'admin'], example: 'familiar' },
      nombre: { type: 'string', example: 'María González' },
      correo: { type: 'string', format: 'email', example: 'maria@email.com' },
      telefono: { type: 'string', nullable: true, example: '5512345678' },
      creado_en: { type: 'string', format: 'date-time' },
    },
  },
  UsuarioRegistrado: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      rol: { type: 'string', enum: ['familiar', 'cuidador'], example: 'familiar' },
      nombre: { type: 'string', example: 'María González' },
      correo: { type: 'string', format: 'email', example: 'maria@email.com' },
      telefono: { type: 'string', nullable: true },
      creado_en: { type: 'string', format: 'date-time' },
    },
  },
  Abuelo: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      familiar_id: { type: 'integer', example: 5 },
      nombre: { type: 'string', example: 'Juan Pérez' },
      nacimiento: { type: 'string', format: 'date', nullable: true, example: '1945-05-20' },
      condiciones: { type: 'string', nullable: true },
      notas: { type: 'string', nullable: true },
    },
  },
  Cuidador: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 3 },
      usuario_id: { type: 'integer', example: 8 },
      cedula: { type: 'string', nullable: true },
      titulo: { type: 'string', nullable: true, example: 'Geriatría' },
      rfc: { type: 'string', nullable: true },
      verificado: { type: 'boolean', example: false },
      descripcion: { type: 'string', nullable: true },
      anios_experiencia: { type: 'integer', minimum: 0, nullable: true },
      tarifa_hora: { type: 'number', nullable: true, example: 150 },
      especialidades: { type: 'string', nullable: true },
      disponible: { type: 'boolean', example: false },
      disponible_desde: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  Medicina: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 2 },
      abuelo_id: { type: 'integer', example: 1 },
      nombre: { type: 'string', example: 'Metformina' },
      dosis: { type: 'string', nullable: true, example: '500 mg' },
      horario: { type: 'string', nullable: true, example: '8:00 AM y 8:00 PM' },
    },
  },
  Disponibilidad: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 7 },
      cuidador_id: { type: 'integer', example: 3 },
      dia_semana: { type: 'integer', minimum: 0, maximum: 6, description: '0 = domingo, 6 = sábado' },
      hora_inicio: { type: 'string', example: '08:00' },
      hora_fin: { type: 'string', example: '14:00' },
    },
  },
  Geocerca: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 4 },
      abuelo_id: { type: 'integer', example: 1 },
      nombre: { type: 'string', example: 'Casa' },
      latitud: { type: 'number', example: 20.9674 },
      longitud: { type: 'number', example: -89.5926 },
      radio_metros: { type: 'integer', example: 100 },
      activo: { type: 'boolean', example: true },
      calle_numero: { type: 'string', nullable: true },
      colonia: { type: 'string', nullable: true },
      codigo_postal: { type: 'string', nullable: true },
      ciudad: { type: 'string', nullable: true },
      estado: { type: 'string', nullable: true },
      pais: { type: 'string', nullable: true },
      direccion_formateada: { type: 'string', nullable: true },
    },
  },
  Servicio: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 12 },
      abuelo_id: { type: 'integer', example: 1 },
      cuidador_id: { type: 'integer', example: 3 },
      nota: { type: 'string', nullable: true },
      inicio: { type: 'string', format: 'date-time', nullable: true },
      fin: { type: 'string', format: 'date-time', nullable: true },
      tarifa_hora: { type: 'number', nullable: true, example: 150 },
      total: { type: 'number', nullable: true, example: 300 },
      comision: { type: 'number', nullable: true, example: 5 },
      estado: { type: 'string', enum: ['activo', 'completado', 'cancelado'], example: 'activo' },
      estado_pago: { type: 'string', enum: ['pendiente', 'pagado', 'liquidado'], nullable: true },
      aceptado_por_familiar: { type: 'boolean', nullable: true },
      aceptado_por_cuidador: { type: 'boolean', nullable: true },
      aceptado_familiar_en: { type: 'string', format: 'date-time', nullable: true },
      aceptado_cuidador_en: { type: 'string', format: 'date-time', nullable: true },
      abuelos: { type: 'object', properties: { nombre: { type: 'string' } } },
      cuidadores: { type: 'object', properties: { id: { type: 'integer' } } },
    },
  },
  Ubicacion: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 20 },
      abuelo_id: { type: 'integer', nullable: true, example: 1 },
      cuidador_id: { type: 'integer', nullable: true, example: 3 },
      latitud: { type: 'number', example: 20.9674 },
      longitud: { type: 'number', example: -89.5926 },
      velocidad: { type: 'number', nullable: true },
      direccion_grados: { type: 'number', nullable: true },
      precision_metros: { type: 'number', nullable: true },
      bateria: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
      fecha: { type: 'string', format: 'date-time' },
      direccion_formateada: { type: 'string', nullable: true },
    },
  },
  Mensaje: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 121 },
      servicio_id: { type: 'integer', example: 12 },
      emisor_id: { type: 'integer', example: 6 },
      contenido: { type: 'string', maxLength: 2000, example: '¿A qué hora llegas mañana?' },
      creado_en: { type: 'string', format: 'date-time' },
      leido_en: { type: 'string', format: 'date-time', nullable: true },
      emisor: { $ref: '#/components/schemas/Usuario' },
    },
  },
  ConsultaCuidador: {
    type: 'object',
    properties: {
      consulta_id: { type: 'integer', example: 10 },
      familiar_id: { type: 'integer', example: 5 },
      cuidador_id: { type: 'integer', example: 3 },
      creado_en: { type: 'string', format: 'date-time' },
      actualizado_en: { type: 'string', format: 'date-time' },
      no_leidos: { type: 'integer', nullable: true, example: 2 },
      familiar: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          nombre: { type: 'string', example: 'María González' },
          rol: { type: 'string', example: 'familiar' },
        },
      },
      cuidador: {
        type: 'object',
        properties: {
          cuidador_id: { type: 'integer', example: 3 },
          nombre: { type: 'string', example: 'Ana López' },
          titulo: { type: 'string', nullable: true, example: 'Geriatría' },
          descripcion: { type: 'string', nullable: true },
          especialidades: { type: 'string', nullable: true },
          tarifa_hora: { type: 'number', nullable: true, example: 150 },
          anios_experiencia: { type: 'integer', nullable: true, example: 5 },
          rol: { type: 'string', example: 'cuidador' },
        },
      },
    },
  },
  MensajeConsulta: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 501 },
      consulta_id: { type: 'integer', example: 10 },
      emisor_id: { type: 'integer', example: 5 },
      contenido: { type: 'string', maxLength: 2000, example: '¿Tienes disponibilidad esta semana?' },
      creado_en: { type: 'string', format: 'date-time' },
      leido_en: { type: 'string', format: 'date-time', nullable: true },
      emisor: { $ref: '#/components/schemas/Usuario' },
    },
  },
  Verificacion: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      cuidador_id: { type: 'integer', example: 3 },
      estado: { type: 'string', enum: ['pendiente', 'aprobado', 'rechazado'] },
      motivo_rechazo: { type: 'string', nullable: true },
      documento_ine_url: { type: 'string', format: 'uri', nullable: true },
      selfie_url: { type: 'string', format: 'uri', nullable: true },
      revisado_por: { type: 'integer', nullable: true },
      revisado_en: { type: 'string', format: 'date-time', nullable: true },
      cuidadores: { $ref: '#/components/schemas/Cuidador' },
      usuarios: { $ref: '#/components/schemas/Usuario' },
    },
  },
  VerificacionPendiente: {
    allOf: [
      { $ref: '#/components/schemas/Verificacion' },
      {
        type: 'object',
        properties: {
          cuidadores: { $ref: '#/components/schemas/Cuidador' },
          usuarios: { $ref: '#/components/schemas/Usuario' },
        },
      },
    ],
  },
  DireccionGeocodificada: {
    type: 'object',
    properties: {
      latitud: { type: 'number', example: 20.9674 },
      longitud: { type: 'number', example: -89.5926 },
      calle_numero: { type: 'string', nullable: true },
      colonia: { type: 'string', nullable: true },
      codigo_postal: { type: 'string', nullable: true },
      ciudad: { type: 'string', nullable: true },
      estado: { type: 'string', nullable: true },
      pais: { type: 'string', nullable: true },
      direccion_formateada: { type: 'string', nullable: true },
    },
  },
  UbicacionTiempoReal: {
    type: 'object',
    properties: {
      mensaje: { type: 'string', example: 'Ubicación recibida y emitida en tiempo real' },
      data: { $ref: '#/components/schemas/Ubicacion' },
    },
  },
  EstadoDisponibilidadCuidador: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 3 },
      disponible: { type: 'boolean', example: true },
      disponible_desde: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  UbicacionCuidadorLibre: {
    type: 'object',
    properties: {
      mensaje: { type: 'string', example: 'Ubicación aproximada actualizada' },
      cuidador_id: { type: 'integer', example: 3 },
      latitud: { type: 'number', example: 20.967 },
      longitud: { type: 'number', example: -89.593 },
      precision_metros: { type: 'number', example: 200 },
    },
  },
  ApiInfo: {
    type: 'object',
    properties: {
      mensaje: { type: 'string', example: 'Qualify API corriendo correctamente' },
      documentacion: { type: 'string', example: '/api-docs' },
      version: { type: 'string', example: '1.0.0' },
      tiempoReal: { type: 'string', example: 'Socket.io activo para ubicaciones en vivo' },
    },
  },
  Health: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      timestamp: { type: 'string', format: 'date-time' },
      uptime: { type: 'number', example: 3600 },
      environment: { type: 'string', example: 'production' },
    },
  },
};

const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });
const colecciones = {
  usuarios: 'UsuarioRegistrado',
  abuelos: 'Abuelo',
  cuidadores: 'Cuidador',
  medicinas: 'Medicina',
  disponibilidad: 'Disponibilidad',
  geocercas: 'Geocerca',
  servicios: 'Servicio',
  ubicaciones: 'Ubicacion',
};

function esquemaRespuesta(path, method) {
  if (path === '/') return schemaRef('ApiInfo');
  if (path === '/health') return schemaRef('Health');
  if (path === '/api/auth/me') return schemaRef('Usuario');
  if (path === '/api/servicios/{id}/mensajes/leidos') {
    return { type: 'object', properties: { actualizados: { type: 'integer', example: 4 } } };
  }
  if (path === '/api/servicios/{id}/mensajes') {
    return method === 'get'
      ? { type: 'array', items: schemaRef('Mensaje') }
      : schemaRef('Mensaje');
  }
  if (path === '/api/geocodificacion/reversa' || path === '/api/geocodificacion/buscar') {
    return schemaRef('DireccionGeocodificada');
  }
  if (path === '/api/verificacion/pendientes') {
    return { type: 'array', items: schemaRef('VerificacionPendiente') };
  }
  if (path === '/api/verificacion/subir-documentos' || path === '/api/verificacion/revisar') {
    return schemaRef('MensajeRespuesta');
  }
  if (path === '/api/cuidadores/{id}/disponible') {
    return schemaRef('EstadoDisponibilidadCuidador');
  }
  if (path === '/api/cuidadores/{id}/ubicacion') {
    return schemaRef('UbicacionCuidadorLibre');
  }
  if (path === '/api/ubicaciones/tiempo-real') {
    return schemaRef('UbicacionTiempoReal');
  }
  if (path === '/api/ubicaciones/ultima/{abuelo_id}') {
    return schemaRef('Ubicacion');
  }

  const collectionMatch = path.match(/^\/api\/([^/]+)$/);
  if (collectionMatch && colecciones[collectionMatch[1]]) {
    const schema = schemaRef(colecciones[collectionMatch[1]]);
    return method === 'get' ? { type: 'array', items: schema } : schema;
  }

  const resourceMatch = path.match(/^\/api\/([^/]+)\/\{id\}$/);
  if (resourceMatch && colecciones[resourceMatch[1]]) {
    return method === 'delete'
      ? schemaRef('MensajeRespuesta')
      : schemaRef(colecciones[resourceMatch[1]]);
  }
  return null;
}

function completarDocumentacionSwagger(spec) {
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;

      for (const parameter of operation.parameters || []) {
        if (parameter.in === 'path' && !parameter.schema) {
          parameter.schema = { type: 'integer', minimum: 1, example: 1 };
        }
      }

      const responses = operation.responses || (operation.responses = {});
      const successStatus = method === 'post' ? '201' : '200';
      if (!Object.keys(responses).some((status) => status.startsWith('2'))) {
        responses[successStatus] = { description: 'Operación completada correctamente' };
      }

      const responseSchema = esquemaRespuesta(path, method);
      for (const [status, response] of Object.entries(responses)) {
        if (status.startsWith('2') && responseSchema && !response.content) {
          response.content = { 'application/json': { schema: responseSchema } };
        } else if (status.startsWith('2') && response.content) {
          const json = response.content['application/json'];
          if (json && !json.schema && responseSchema) json.schema = responseSchema;
        }

        if (status.startsWith('4') || status.startsWith('5')) {
          response.content = response.content || {
            'application/json': { schema: schemaRef('Error') },
          };
          if (response.content['application/json'] && !response.content['application/json'].schema) {
            response.content['application/json'].schema = schemaRef('Error');
          }
        }
      }

      const protectedOperation = operation.security === undefined
        ? Boolean(spec.security && spec.security.length)
        : operation.security.length > 0;
      if (protectedOperation && !responses['401']) {
        responses['401'] = {
          description: 'Token ausente, inválido o expirado',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      if (path.includes('{') && !responses['404']) {
        responses['404'] = {
          description: 'No se encontró el recurso solicitado',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      if (
        ['post', 'put', 'patch'].includes(method) &&
        operation.requestBody &&
        !responses['400']
      ) {
        responses['400'] = {
          description: 'Solicitud inválida o datos no aceptados',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      const noPermissionStatusApplies =
        protectedOperation &&
        (
          (path.includes('{') && !['/api/cuidadores/{id}', '/api/disponibilidad/{id}'].includes(path)) ||
          (
            ['post', 'put', 'patch', 'delete'].includes(method) &&
            path !== '/api/verificacion/subir-documentos'
          )
        );
      if (
        noPermissionStatusApplies &&
        !responses['403']
      ) {
        responses['403'] = {
          description: 'No tienes permiso para realizar esta operación',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      if (!responses['500']) {
        responses['500'] = {
          description: 'Error interno al procesar la solicitud',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      if (
        path.startsWith('/api/geocodificacion/') &&
        !responses['502']
      ) {
        responses['502'] = {
          description: 'No se pudo consultar el servicio de geocodificación',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }

      const chatMigrationRequired =
        (path === '/api/servicios/{id}/aceptar' && method === 'put') ||
        (path === '/api/servicios/{id}/mensajes' && method === 'post') ||
        (path === '/api/servicios/{id}/mensajes/leidos' && method === 'put');
      if (chatMigrationRequired && !responses['503']) {
        responses['503'] = {
          description: 'La función del chat aún no está disponible en la base de datos',
          content: { 'application/json': { schema: schemaRef('Error') } },
        };
      }
    }
  }
}

swaggerDocs.paths['/'] = {
  get: {
    summary: 'Información de la API',
    tags: ['Estado'],
    security: [],
    responses: {
      200: {
        description: 'La API está disponible',
        content: { 'application/json': { schema: schemaRef('ApiInfo') } },
      },
    },
  },
};
swaggerDocs.paths['/health'] = {
  get: {
    summary: 'Comprobar el estado del servicio',
    tags: ['Estado'],
    security: [],
    responses: {
      200: {
        description: 'Estado actual de la API',
        content: { 'application/json': { schema: schemaRef('Health') } },
      },
    },
  },
};

completarDocumentacionSwagger(swaggerDocs);

// JSON del spec (útil para depurar qué versión está sirviendo Render)
app.get('/api-docs.json', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json(swaggerDocs);
});

// Swagger UI sin caché: evita que el navegador muestre una versión vieja
app.use(
  '/api-docs',
  (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    persistAuthorization: true,
    filter: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: -1,
  })
);

// ============================================
// RUTAS REST
// ============================================
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/abuelos', require('./src/routes/abuelos'));
app.use('/api/cuidadores', require('./src/routes/cuidadores'));
app.use('/api/medicinas', require('./src/routes/medicinas'));
app.use('/api/servicios', require('./src/routes/servicios'));
app.use('/api/servicios', require('./src/routes/chat'));
app.use('/api/consultas', require('./src/routes/consultasCuidadores'));
app.use('/api/ubicaciones', require('./src/routes/ubicaciones'));
app.use('/api/disponibilidad', require('./src/routes/disponibilidad'));
app.use('/api/verificacion', require('./src/routes/verificacion'));
app.use('/api/geocercas', require('./src/routes/geocercas'));
app.use('/api/geocodificacion', require('./src/routes/geocodificacion'));
app.use('/api/auth', require('./src/routes/auth'));

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Qualify API corriendo correctamente',
    documentacion: '/api-docs',
    version: '1.0.0',
    tiempoReal: 'Socket.io activo para ubicaciones en vivo',
  });
});

// Exportar io para usarlo en los sockets
app.set('io', io);

// Sockets de ubicación en tiempo real
require('./src/sockets/ubicacion')(io);

// Ruta 404 para endpoints inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo global de errores (no filtrar stack traces en producción)
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

server.listen(PORT, () => {
  console.log(`\n=======================================`);
  console.log(` Servidor Qualify API: http://localhost:${PORT}`);
  console.log(` Swagger UI:           http://localhost:${PORT}/api-docs`);
  console.log(` Health check:         http://localhost:${PORT}/health`);
  console.log(` Socket.io:            activo en puerto ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('\n⚠️  ADVERTENCIA: JWT_SECRET no está definido como variable de entorno.');
    console.warn('   Usando clave por defecto — INSEGURO para producción.');
    console.warn('   Agregar JWT_SECRET en Render → Environment Variables.\n');
  }
  console.log(`=======================================\n`);
});
