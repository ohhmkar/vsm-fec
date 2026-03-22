import winston from 'winston';
import { config } from 'dotenv';
config();

const levels = {
  error: 0,
  info: 1,
  http: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  info: 'green',
  http: 'magenta',
  debug: 'yellow',
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'http';
};

winston.addColors(colors);

export const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) =>
        `[${info.level.toUpperCase()} - ${info.timestamp}] ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/all.log',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});
