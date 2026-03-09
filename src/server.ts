import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { PUBLIC_PATH, STATIC_PATH } from './lib/constants';
import articlesRouter from './routers/articlesRouter';
import productsRouter from './routers/productsRouter';
import commentsRouter from './routers/commentsRouter';
import imagesRouter from './routers/imagesRouter';
import authRouter from './routers/authRoutes';
import { defaultNotFoundHandler, globalErrorHandler } from './controllers/errorController';

const server: Application = express();

// 💡 기본 설정
server.use(cors());
server.use(express.json());
server.use('/auth', authRouter); 

// 💡 정적 파일 설정
server.use(STATIC_PATH, express.static(path.resolve(process.cwd(), PUBLIC_PATH)));

// 💡 라우터 연결
server.use('/articles', articlesRouter);
server.use('/products', productsRouter);
server.use('/comments', commentsRouter);
server.use('/images', imagesRouter);

// 💡 에러 핸들러
server.use(defaultNotFoundHandler);
server.use(globalErrorHandler);

export default server; // 👈 main.ts에서 가져다 쓸 수 있게 내보냅니다.