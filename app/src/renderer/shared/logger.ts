import type { LogLevel } from "~/shared/types";

const levelToConsole: Record<LogLevel, keyof Console> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

export type LogFunctions = {
  debug(...args: unknown[]): void;
  error(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};

function write(level: LogLevel, scope: string, ...args: unknown[]) {
  const consoleMethod = console[levelToConsole[level]] as (
    ...consoleArgs: unknown[]
  ) => void;
  const prefix = `[${scope}]`;
  if (args.length === 0) {
    consoleMethod(prefix);
    return;
  }

  const [first, ...rest] = args;
  if (typeof first === "string") {
    consoleMethod(`${prefix} ${first}`, ...rest);
    return;
  }

  consoleMethod(prefix, first, ...rest);
}

export function createRendererLogger(scope = "renderer"): LogFunctions {
  return {
    debug: (...args: unknown[]) => write("debug", scope, ...args),
    info: (...args: unknown[]) => write("info", scope, ...args),
    warn: (...args: unknown[]) => write("warn", scope, ...args),
    error: (...args: unknown[]) => write("error", scope, ...args),
  };
}

type ScopedRendererLogger = LogFunctions & {
  scope(scope: string): LogFunctions;
};

const logger: ScopedRendererLogger = {
  ...createRendererLogger("renderer"),
  scope: (scope: string) => createRendererLogger(scope),
};

export default logger;
