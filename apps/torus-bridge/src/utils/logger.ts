export const logger = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (message: string, err: unknown, ...args: unknown[]) => {
    console.error(message, err, ...args);
  },
};
