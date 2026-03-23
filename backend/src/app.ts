import express from 'express';
import 'express-async-errors';
import { Server } from 'socket.io';
import { createServer } from 'http';

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { setIO } from './services/socket.service';

const app = express();
const httpServer = createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter only in production (dev mode needs unrestricted access for load testing)
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
}

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

setIO(io);
registerGameGateway(io);

httpServer.listen(port, () => {
  console.log(`Server Listening to port: ${port}...`);
  console.log('Game server ready. Use admin panel to start the game and rounds.');
});
