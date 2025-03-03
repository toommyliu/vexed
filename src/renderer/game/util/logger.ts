import type { Logger as WinstonLogger } from 'winston';
import winston, { createLogger, format, transports } from 'winston';

export class Logger {
  private readonly scope: string;

  private readonly logger: WinstonLogger;

  private constructor(scope: string) {
    this.scope = scope;
    this.logger = createLogger({
      level: 'debug',
      levels: winston.config.npm.levels,
      transports: [new transports.Console({ level: 'debug' })],
      format: format.combine(
        format.timestamp({ format: 'HH:mm:ss' }),
        format.printf(
          ({ level, message, timestamp }) =>
            `[${timestamp}] [${level}]${this.scope ? ` (${this.scope})` : ''} ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        ),
      ),
    });
  }

  public info(message: unknown): void {
    this.logger.info(message);
  }

  public warn(message: unknown): void {
    this.logger.warn(message);
  }

  public error(message: unknown): void {
    this.logger.error(message);
  }

  public debug(message: unknown): void {
    this.logger.debug(message);
  }

  public static get(scope: string): Logger {
    return new Logger(scope);
  }
}

window.logger = Logger.get('');
