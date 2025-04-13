/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Err, Result } from "./result.ts";

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
export interface BaseLogger {
  trace(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  [x: string]: any;
}

interface Logger extends BaseLogger {
  ifError<E>(err: E | undefined): err is E;
}

/**
 * Dummy logger that does not do anything.
 *
 * Useful as a default for some library that the user might want to get logs out of.
 */
export const noopLogger: BaseLogger = {
  trace: (_message?: any, ..._optionalParams: any[]) => {},
  debug: (_message?: any, ..._optionalParams: any[]) => {},
  info: (_message?: any, ..._optionalParams: any[]) => {},
  warn: (_message?: any, ..._optionalParams: any[]) => {},
  error: (_message?: any, ..._optionalParams: any[]) => {},
};

export class BasicLogger implements Logger {
  private name: string;

  constructor({ name }: { name: string }) {
    this.name = name;
  }

  static create = ({ name }: { name: string }): BasicLogger => {
    return new BasicLogger({ name });
  };

  withPath(name: string): Logger {
    return new BasicLogger({ name: `${this.name}:${name}` });
  }

  trace(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] TRACE:`, message, ...optionalParams);
  }

  debug(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] DEBUG:`, message, ...optionalParams);
  }

  info(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] INFO:`, message, ...optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] WARN:`, message, ...optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] ERROR:`, message, ...optionalParams);
  }

  ifError<E>(err: E | undefined): err is E {
    if (err !== undefined) {
      log(`[${this.name}] ERROR:`, err);
      return true;
    }
    return false;
  }

  ifResultIsErr<T, E>(
    result: Result<T, E>,
    message?: string | ((error: E) => string),
  ): result is Err<E> {
    const [error, _] = result;
    if (error !== undefined) {
      if (typeof message === "function") {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.error(`${message(error)} ${error}`);
      } else if (message !== undefined) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.error(`${message} ${error}`);
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.error(`${error}`);
      }
      return true;
    }
    return false;
  }
}

/**
 * @deprecated
 */
export const createLogger = BasicLogger.create;
