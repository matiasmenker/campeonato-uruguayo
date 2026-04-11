import pino from "pino";
export interface Logger {
  info(msg: string, obj?: Record<string, unknown>): void;
  warn(msg: string, obj?: Record<string, unknown>): void;
  error(msg: string, obj?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}
const createPinoLogger = (): pino.Logger => {
  return pino({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  });
};
export const createLogger = (name: string): Logger => {
  const pinoLogger = createPinoLogger().child({ name });
  return {
    info: (msg, obj) => pinoLogger.info(obj ?? {}, msg),
    warn: (msg, obj) => pinoLogger.warn(obj ?? {}, msg),
    error: (msg, obj) => pinoLogger.error(obj ?? {}, msg),
    child: (bindings) => {
      const child = pinoLogger.child(bindings);
      return {
        info: (m, o) => child.info(o ?? {}, m),
        warn: (m, o) => child.warn(o ?? {}, m),
        error: (m, o) => child.error(o ?? {}, m),
        child: (b) => createLogger(name).child({ ...bindings, ...b }),
      };
    },
  };
};
