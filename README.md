# Qualify API

API REST para el MVP de **Qualify**, una aplicación de cuidado de adultos mayores desarrollada con **Node.js, Express, Supabase (PostgreSQL)** y **Socket.io** para rastreo de ubicación en tiempo real (tipo Life360).

---

## 📋 Tabla de contenidos

- [🚀 Descripción](#-descripción)
- [🛠️ Tecnologías](#️-tecnologías)
- [📐 Arquitectura](#-arquitectura)
- [🗄️ Modelo de datos](#️-modelo-de-datos)
- [🔌 Endpoints principales](#-endpoints-principales)
- [🔑 Variables de entorno](#-variables-de-entorno)
- [💻 Instalación local](#-instalación-local)
- [☁️ Despliegue en Render](#️-despliegue-en-render)
- [🗺️ Mapa tipo Life360](#️-mapa-tipo-life360)
- [🛡️ Verificación de identidad](#️-verificación-de-identidad)
- [📄 Documentación Swagger](#-documentación-swagger)
- [📬 Contacto](#-contacto)
- [⚖️ Licencia](#-licencia)

---

## 🚀 Descripción

Qualify es una plataforma para conectar familias con cuidadores de adultos mayores. Esta API gestiona:

- **Usuarios** (familiares y cuidadores con autenticación JWT y contraseñas con bcrypt)
- **Abuelos** registrados por sus familiares
- **Medicinas** por abuelo
- **Servicios** de cuidado con control de pagos y comisiones
- **Ubicación en tiempo real** del cuidador (WebSockets + Socket.io)
- **Geocercas** y alertas cuando el cuidador sale de zonas seguras
- **Verificación de identidad** manual (subida de INE y selfie)
- **Disponibilidad horaria** de cuidadores

Desarrollado como MVP con arquitectura **MVC** y listo para desplegar en la nube.

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| [Node.js](https://nodejs.org/) | Runtime del servidor |
| [Express](https://expressjs.com/) | Framework web |
| [Supabase](https://supabase.com/) | Base de datos PostgreSQL + Storage |
| [Socket.io](https://socket.io/) | Tiempo real (ubicaciones) |
| [Swagger UI](https://swagger.io/tools/swagger-ui/) | Documentación interactiva de la API |
| [Joi](https://joi.dev/) | Validación de datos de entrada |
| [Multer](https://github.com/expressjs/multer) | Subida de archivos (documentos) |
| [dotenv](https://github.com/motdotla/dotenv) | Variables de entorno |

---

## 📐 Arquitectura

El proyecto sigue una arquitectura **MVC** separada por responsabilidades:

```
src/
├── config/         # Configuración de Supabase
├── controllers/    # Lógica de negocio por recurso
├── models/         # Validaciones con Joi
├── routes/         # Definición de endpoints (Express + Swagger)
├── middleware/     # Autenticación (JWT de Supabase)
└── sockets/        # Eventos de tiempo real con Socket.io
```

---

## 🗄️ Modelo de datos

Las principales tablas en Supabase (PostgreSQL):

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas de acceso (rol: familiar / cuidador) |
| `abuelos` | Adultos mayores registrados por familiares |
| `cuidadores` | Datos del empleado, cédula, RFC, verificado |
| `medicinas` | Medicinas asignadas a cada abuelo |
| `servicios` | Contrataciones abuelo–cuidador con estado de pago |
| `ubicaciones` | GPS en tiempo real con velocidad y batería |
| `disponibilidad` | Horarios semanales del cuidador |
| `geocercas` | Zonas seguras (casa, centro de día, etc.) |
| `alertas_ubicacion` | Notificaciones de salida de zona |
| `verificaciones_cuidador` | Proceso de verificación de documentos |

Relaciones principales:
- `usuarios` 1:1 `cuidadores`
- `usuarios` 1:N `abuelos` (un familiar registra varios abuelos)
- `abuelos` 1:N `medicinas`, `servicios`, `ubicaciones`
- `cuidadores` 1:N `servicios`, `disponibilidad`, `ubicaciones`

---

## 🔌 Endpoints principales

### Usuarios
- `GET /api/usuarios` — Listar usuarios
- `POST /api/usuarios` — Crear usuario
- `GET /api/usuarios/:id` — Obtener usuario
- `PUT /api/usuarios/:id` — Actualizar
- `DELETE /api/usuarios/:id` — Eliminar

### Abuelos
- `GET /api/abuelos` — Listar abuelos
- `POST /api/abuelos` — Registrar abuelo

### Cuidadores
- `GET /api/cuidadores` — Listar cuidadores
- `POST /api/cuidadores` — Crear cuidador

### Servicios
- `GET /api/servicios` — Listar servicios
- `POST /api/servicios` — Crear servicio (requiere cuidador verificado)

### Ubicaciones (tiempo real)
- `POST /api/ubicaciones/tiempo-real` — Enviar ubicación GPS
- `GET /api/ubicaciones/ultima/:abuelo_id` — Última ubicación conocida

### Verificación de identidad
- `POST /api/verificacion/subir-documentos` — Subir INE y selfie
- `POST /api/verificacion/revisar` — Aprobar/rechazar (admin)
- `GET /api/verificacion/pendientes` — Ver solicitudes pendientes

### Geocercas
- `GET /api/geocercas` — Listar zonas seguras
- `POST /api/geocercas` — Crear geocerca

Todos los endpoints requieren autenticación mediante **Bearer Token** JWT (obtenido en `POST /api/auth/login`), excepto el registro y el login, que son públicos.

El backend usa la **service role key** de Supabase, por lo que el control de acceso se valida en el middleware de JWT y en cada controlador: un familiar solo accede a sus abuelos y un cuidador solo a los abuelos con servicios asignados.

---

## 🔑 Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
PORT=3000

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# JWT
JWT_SECRET=cambia-esta-clave-en-produccion

# Socket.io CORS
SOCKET_CORS_ORIGIN=http://localhost:5173
```

> ⚠️ Nunca subas tu archivo `.env` a GitHub. Está incluido en `.gitignore`.

---

## 💻 Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/TU-USUARIO/qualify-api.git
cd qualify-api

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac

# Ejecutar en modo desarrollo
npm run dev
```

La API estará disponible en:
- **Servidor:** `http://localhost:3000`
- **Swagger:** `http://localhost:3000/api-docs`

---

## ☁️ Despliegue en Render

1. Sube este repositorio a GitHub.
2. Conecta tu repositorio en [Render](https://render.com).
3. Configura las variables de entorno en el panel de Render.
4. El comando de inicio es: `npm start`
5. Tu API quedará en `https://tu-api.onrender.com`

---

## 🗺️ Mapa tipo Life360

El frontend se conecta a la API por **Socket.io** para recibir ubicaciones en tiempo real:

```javascript
const socket = io('https://tu-api.onrender.com');
socket.emit('unirse_a_abuelo', ID_ABUELO);

socket.on('ubicacion_actualizada', (data) => {
  // Mover marcador en el mapa (Leaflet / OpenStreetMap)
  marcador.setLatLng([data.latitud, data.longitud]);
});
```

**Nota:** Este MVP usa **OpenStreetMap + Leaflet** (gratis, sin API key). Si prefieres Google Maps, necesitarás activar la Maps JavaScript API en Google Cloud Console.

---

## 🛡️ Verificación de identidad

Flujo tipo Didi/Uber para cuidadores:

1. El cuidador se registra (`verificado = false`).
2. Sube fotos de su INE (delantera y trasera) y un selfie.
3. Un administrador revisa los documentos en `/api/verificacion/pendientes`.
4. Si se aprueba, se activa `verificado = true` y puede crear servicios.

---

## 📄 Documentación Swagger

Una vez corriendo el servidor, accede a:
```
http://localhost:3000/api-docs
```
Desde ahí puedes probar todos los endpoints directamente desde el navegador.

---

## 📬 Contacto

Si tienes preguntas sobre este proyecto o quieres colaborar, abre un **Issue** en este repositorio.

---

## ⚖️ Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

_Desarrollado como MVP para la plataforma Qualify — Cuidado de adultos mayores._
