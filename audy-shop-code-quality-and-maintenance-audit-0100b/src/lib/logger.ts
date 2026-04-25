/**
 * Simple logger utility for Audy Shop
 * Provides consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

const isDevelopment = import.meta.env.DEV;

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const log = (level: LogLevel, module: string, message: string, data?: unknown): void => {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    module,
    message,
    data,
  };

  if (!isDevelopment && level === 'debug') {
    return;
  }

  const prefix = `[AudyShop:${module}]`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, message, data ?? '');
      break;
    case 'info':
      console.info(prefix, message, data ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, data ?? '');
      break;
    case 'error':
      console.error(prefix, message, data ?? '');
      break;
  }
};

export const logger = {
  debug: (module: string, message: string, data?: unknown) => log('debug', module, message, data),
  info: (module: string, message: string, data?: unknown) => log('info', module, message, data),
  warn: (module: string, message: string, data?: unknown) => log('warn', module, message, data),
  error: (module: string, message: string, error?: unknown) => log('error', module, message, error),
};
