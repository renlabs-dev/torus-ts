/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Simple default log function.
 *
 * Should be migrated to actual logging interface.
 */
export function log(...args: unknown[]) {
  const [first, ...rest] = args;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${new Date().toISOString()}] ${first}`, ...rest);
}

// ====

/**
 * Represents a generic logger that could be a simple console, bunyan etc.
 */
export interface Logger {
  trace(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  [x: string]: unknown; // any
}

/**
 * Dummy logger that does not do anything.
 *
 * Useful as a default for some library that the user might want to get logs out of.
 */
export const noopLogger: Logger = {
  trace: (_message?: any, ..._optionalParams: any[]) => {},
  debug: (_message?: any, ..._optionalParams: any[]) => {},
  info: (_message?: any, ..._optionalParams: any[]) => {},
  warn: (_message?: any, ..._optionalParams: any[]) => {},
  error: (_message?: any, ..._optionalParams: any[]) => {},
};

export const createLogger = ({ name }: { name: string }): Logger => {
  return {
    trace: (message?: any, ...optionalParams: any[]) => {
      log(`[${name}] TRACE:`, message, ...optionalParams);
    },
    debug: (message?: any, ...optionalParams: any[]) => {
      log(`[${name}] DEBUG:`, message, ...optionalParams);
    },
    info: (message?: any, ...optionalParams: any[]) => {
      log(`[${name}] INFO:`, message, ...optionalParams);
    },
    warn: (message?: any, ...optionalParams: any[]) => {
      log(`[${name}] WARN:`, message, ...optionalParams);
    },
    error: (message?: any, ...optionalParams: any[]) => {
      log(`[${name}] ERROR:`, message, ...optionalParams);
    },
  };
};
