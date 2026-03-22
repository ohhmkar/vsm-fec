import morgan from 'morgan';
import { logger } from '../services/index';

export const accessLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) =>
        logger.http(message.substring(0, message.lastIndexOf('\n'))),
    },
  },
);
