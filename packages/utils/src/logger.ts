/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Err, Result } from "./result/index.js";
import { nowISOString } from "./date-time.js";

function getCallerInfo(): string {
  const stack = new Error().stack;
  if (!stack) return "";

  const lines = stack.split("\n");
  const callerLine = lines[3] ?? lines[2] ?? "";

  const match = /\(?([^()]+):(\d+):(\d+)\)?$/.exec(callerLine);
  if (match?.[1]) {
    const [_, file, line, col] = match;

    const root = process.cwd();
    if (file.startsWith(root)) {
      const relativePath = file.slice(root.length + 1);
      return `${relativePath}:${line}:${col}`;
    }

    return `${file}:${line}:${col}`;
  }

  return "";
}

/**
 * Simple default log function.
 *
 * Should be migrated to actual logging interface.
 */
export function log(...args: unknown[]) {
  const [first, ...rest] = args;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${nowISOString()}] ${first}`, ...rest);
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
    const callerInfo = getCallerInfo();
    log(`[${this.name}] DEBUG: ${callerInfo}`, message, ...optionalParams);
  }

  info(message?: any, ...optionalParams: any[]): void {
    log(`[${this.name}] INFO:`, message, ...optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    const callerInfo = getCallerInfo();
    log(`[${this.name}] WARN: ${callerInfo}`, message, ...optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    const callerInfo = getCallerInfo();
    log(`[${this.name}] ERROR: ${callerInfo}: `, message, ...optionalParams);
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
        this.error(`${message(error)} ${String(error)}`);
      } else if (message !== undefined) {
        this.error(`${message} ${String(error)}`);
      } else {
        this.error(`${String(error)}`);
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
