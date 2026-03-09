import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(` User connected: ${socket.id}`);

    socket.on('join', (userId: string | number) => {
      socket.join(`user_${userId}`);
      console.log(` User ${userId} joined their private room.`);
    });

    socket.on('disconnect', () => {
      console.log(' User disconnected');
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("⚠️ Socket.io not initialized! Call initSocket first.");
  }
  return io;
};