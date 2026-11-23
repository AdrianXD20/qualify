/**
 * Socket.io para ubicaciones en tiempo real (tipo Life360).
 * Los clientes se unen a una sala por abuelo_id para recibir actualizaciones
 * solo de las ubicaciones de ese abuelo.
 */

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado via Socket.io:', socket.id);

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

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
};
