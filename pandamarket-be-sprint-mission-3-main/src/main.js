import express from 'express';
import http from 'http'; 
import cors from 'cors';
import path from 'path';
import { initSocket, setupSocket } from './socket/socket.js'; 
import { PORT, PUBLIC_PATH, STATIC_PATH } from './lib/constants.js';
import articlesRouter from './routers/articlesRouter.js';
import productsRouter from './routers/productsRouter.js';
import commentsRouter from './routers/commentsRouter.js';
import imagesRouter from './routers/imagesRouter.js';
import { defaultNotFoundHandler, globalErrorHandler } from './controllers/errorController.js';


const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

initSocket(server);

app.use(cors());
app.use(express.json());
app.use(STATIC_PATH, express.static(path.resolve(process.cwd(), PUBLIC_PATH)));

app.use('/articles', articlesRouter);
app.use('/products', productsRouter);
app.use('/comments', commentsRouter);
app.use('/images', imagesRouter);

app.use(defaultNotFoundHandler);
app.use(globalErrorHandler);

app.set('io', io);

server.listen(PORT, () => {
  console.log(` Server & WebSocket started on port ${PORT}`);
});