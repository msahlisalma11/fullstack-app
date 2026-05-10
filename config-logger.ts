// src/config/logger.ts
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label, number) => {
      return {
        level: number,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = pino(pinoConfig);

// Export child loggers for different modules
export const createChildLogger = (name: string) => {
  return logger.child({ module: name });
};
