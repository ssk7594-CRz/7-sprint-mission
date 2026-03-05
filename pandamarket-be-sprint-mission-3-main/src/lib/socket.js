import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // 실제 서비스 시에는 프론트엔드 도메인으로 제한하세요!
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 사용자가 로그인하면 자신의 userId로 된 Room에 입장하도록 설정
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their private room.`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};