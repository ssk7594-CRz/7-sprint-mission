import http from 'http';
import serverApp from './server'; // server.ts를 가져옵니다.
import { setupSocket } from './socket/socket';
import { PORT } from './lib/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
  try {
    // 1. DB 연결 확인
    await prisma.$connect();
    console.log('✅ Database connected');

    // 2. HTTP 서버 생성 (serverApp 사용)
    const httpServer: http.Server = http.createServer(serverApp);

    // 3. 소켓 설정 및 저장
    const io = setupSocket(httpServer);
    serverApp.set('io', io); // 이제 컨트롤러에서 req.app.get('io') 가능!

    // 4. 리스닝 시작
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server start failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();