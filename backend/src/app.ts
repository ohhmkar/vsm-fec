import express from 'express';
import 'express-async-errors';
import { Server } from 'socket.io';
import { createServer } from 'http';

import cors from 'cors';
import helmet from 'helmet';
import { accessLogger as logger } from './middlewares/access-logger.middleware';
import {
  authenticateRequest,
  authenticateSocketConnection,
} from './middlewares/authenticator.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { globalErrorHandler } from './middlewares/error-handler.middleware';

import { authRouter } from './controllers/auth/auth.router';
import { gameRouter } from './controllers/game/game.router';
import { adminRouter } from './controllers/admin/admin.router';

import { registerGameGateway, startGame, startRound } from './game/game';
import { allowedOrigin, port } from './common/app.config';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin,
  }),
);
app.use(logger);

app.get('/', (req, res) => {
  res.send('<h1>Hello, World</h1>');
});

app.use('/auth', authRouter);
app.use('/admin', authenticateRequest, adminRouter);
app.use('/game', authenticateRequest, gameRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

io.engine.use(logger);
io.engine.use(helmet());
io.use(authenticateSocketConnection);

registerGameGateway(io);

httpServer.listen(port, () => {
  console.log(`Server Listening to port: ${port}...`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Auto-starting game for development...');
    setTimeout(() => {
      startGame().then(() => startRound());
    }, 1000);
  }
});
