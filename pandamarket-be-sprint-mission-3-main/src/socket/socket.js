import { Server } from 'socket.io';

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('소켓 연결됨:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`유저 ${userId}가 알림 방(user_${userId})에 입장했습니다.`);
    });

    socket.on('disconnect', () => {
      console.log('소켓 연결 해제');
    });
  });

  return io;
};

export const emitNotification = (io, userId, notificationData) => {
  if (io) {
    io.to(`user_${userId}`).emit('NEW_NOTIFICATION', notificationData);
  }
};