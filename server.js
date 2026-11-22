require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io para tiempo real (tipo Life360)
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qualify API',
      version: '1.0.0',
      description: 'API REST para app de cuidado de adultos mayores (MVP tipo Life360 con Supabase + OpenStreetMap)',
      contact: {
        name: 'Qualify Team',
      },
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Servidor local de desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de Supabase Auth (Bearer <token>)',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors());
app.use(express.json());

// Documentación interactiva
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas REST
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/abuelos', require('./src/routes/abuelos'));
app.use('/api/cuidadores', require('./src/routes/cuidadores'));
app.use('/api/medicinas', require('./src/routes/medicinas'));
app.use('/api/servicios', require('./src/routes/servicios'));
app.use('/api/ubicaciones', require('./src/routes/ubicaciones'));
app.use('/api/disponibilidad', require('./src/routes/disponibilidad'));
app.use('/api/verificacion', require('./src/routes/verificacion'));
app.use('/api/geocercas', require('./src/routes/geocercas'));

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

server.listen(PORT, () => {
  console.log(`\n=======================================`);
  console.log(` Servidor Qualify API: http://localhost:${PORT}`);
  console.log(` Swagger UI:           http://localhost:${PORT}/api-docs`);
  console.log(` Socket.io:            activo en puerto ${PORT}`);
  console.log(`=======================================\n`);
});
