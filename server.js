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

