import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';

export const setupSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('소켓 연결됨:', socket.id);

    socket.on('join', (userId: string | number) => {
      socket.join(`user_${userId}`);
      console.log(`유저 ${userId}가 알림 방(user_${userId})에 입장했습니다.`);
    });

    socket.on('disconnect', () => {
      console.log('소켓 연결 해제');
    });
  });

  return io;
};

export const emitNotification = (io: Server | undefined, userId: string | number, notificationData: any): void => {
  if (io) {
    io.to(`user_${userId}`).emit('NEW_NOTIFICATION', notificationData);
  }
};