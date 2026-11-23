/**
 * Socket.io para tiempo real:
 * - Ubicaciones del abuelo (salas abuelo_{id})
 * - Cuidadores libres (sala cuidadores_libres)
 * - Chat de una cita (sala chat_servicio_{id}, requiere JWT y participación)
 *
 * Autenticación: el cliente envía el JWT al conectar:
 *   io(url, { auth: { token: '<jwt>' } })
 */

const { verificarToken } = require('../middleware/auth');
const { obtenerServicioParaChat, esParticipante, chatHabilitado } = require('../utils/chat');

module.exports = function (io) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (token) {
      try {
        socket.data.usuario = verificarToken(token);
        // Sala personal: sirve para avisar de citas aceptadas y mensajes nuevos.
        socket.join(`usuario_${socket.data.usuario.id}`);
      } catch (err) {
        socket.data.usuario = null;
        console.warn(`Socket ${socket.id} con token inválido:`, err.message);
      }
    }

    console.log(
      `Cliente conectado via Socket.io: ${socket.id}` +
        (socket.data.usuario ? ` (usuario ${socket.data.usuario.id})` : ' (anónimo)')
    );

    // Unirse a la sala de un abuelo específico para ver sus ubicaciones
    socket.on('unirse_a_abuelo', (abuelo_id) => {
      socket.join(`abuelo_${abuelo_id}`);
      console.log(`Socket ${socket.id} se unió a sala abuelo_${abuelo_id}`);
    });

    // Salir de la sala
    socket.on('salir_de_abuelo', (abuelo_id) => {
      socket.leave(`abuelo_${abuelo_id}`);
      console.log(`Socket ${socket.id} salió de sala abuelo_${abuelo_id}`);
    });

    // Sala pública con las ubicaciones aproximadas de los cuidadores libres
    socket.on('unirse_a_cuidadores_libres', () => {
      socket.join('cuidadores_libres');
      console.log(`Socket ${socket.id} se unió a cuidadores_libres`);
    });

    socket.on('salir_de_cuidadores_libres', () => {
      socket.leave('cuidadores_libres');
      console.log(`Socket ${socket.id} salió de cuidadores_libres`);
    });

    // ------------------------------------------------------------
    // CHAT: solo participantes de la cita y con el chat habilitado
    // ------------------------------------------------------------
    socket.on('unirse_a_chat', async (servicioId, ack) => {
      const responder = (payload) => {
        if (typeof ack === 'function') ack(payload);
      };

      const usuario = socket.data.usuario;
      if (!usuario) {
        return responder({ ok: false, error: 'Token requerido para el chat' });
      }

      try {
        const contexto = await obtenerServicioParaChat(servicioId);

        if (!contexto) {
          return responder({ ok: false, error: 'Servicio no encontrado' });
        }

        if (!esParticipante(usuario, contexto)) {
          return responder({ ok: false, error: 'No participas en este servicio' });
        }

        if (!chatHabilitado(contexto.servicio)) {
          return responder({
            ok: false,
            error: 'El chat se habilita cuando el cuidador acepta la cita',
          });
        }

        const sala = `chat_servicio_${contexto.servicio.id}`;
        socket.join(sala);
        console.log(`Socket ${socket.id} se unió a sala ${sala}`);

        responder({ ok: true, servicio_id: contexto.servicio.id, habilitado: true });
      } catch (err) {
        console.error('Error al unirse al chat:', err.message);
        responder({ ok: false, error: 'No se pudo abrir el chat' });
      }
    });

    socket.on('salir_de_chat', (servicioId) => {
      socket.leave(`chat_servicio_${servicioId}`);
    });

    // Indicador de "escribiendo..." (sin persistencia)
    socket.on('escribiendo', (datos = {}) => {
      const sala = `chat_servicio_${datos.servicio_id}`;
      if (!socket.data.usuario || !socket.rooms.has(sala)) return;

      socket.to(sala).emit('escribiendo', {
        servicio_id: datos.servicio_id,
        usuario_id: socket.data.usuario.id,
        escribiendo: Boolean(datos.escribiendo),
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
};
