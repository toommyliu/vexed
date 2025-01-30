import { join } from 'path';
import kleur from 'kleur';
import winston from 'winston';
import { DOCUMENTS_PATH } from './constants';

class Logger {
	private static instance: Logger;

	private readonly winstonLogger: winston.Logger;

	private constructor() {
		const customFormat = winston.format.printf(
			({ level, message, timestamp, process }) => {
				const scope =
					typeof window === 'undefined' ? '[main]' : '[renderer]';
				return `[${timestamp}] ${scope} [${level}] ${message}`;
			},
		);

		this.winstonLogger = winston.createLogger({
			format: winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			transports: [
				new winston.transports.File({
					filename: join(DOCUMENTS_PATH, 'log.txt'),
					options: { flags: 'w' },
					format: winston.format.combine(
						winston.format.timestamp({
							format: 'YYYY-MM-DD HH:mm:ss',
						}),
						customFormat,
					),
				}),
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.timestamp({ format: 'HH:mm:ss' }),
						winston.format.printf(
							({ level, message, timestamp, process }) => {
								const colorizedLevel = (() => {
									switch (level) {
										case 'error':
											return kleur.red(level);
										case 'warn':
											return kleur.yellow(level);
										case 'info':
											return kleur.green(level);
										case 'debug':
											return kleur.blue(level);
										default:
											return level;
									}
								})();

								const scope =
									typeof window === 'undefined'
										? '[main]'
										: '[renderer]';
								const scopeStr = scope
									? `${kleur.magenta(scope)}`
									: '';
								return `[${kleur.gray(timestamp as string)}] ${scopeStr} [${colorizedLevel}] ${message}`;
							},
						),
					),
				}),
			],
		});
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}

		return Logger.instance;
	}

	public error(message: string, error?: Error): void {
		this.winstonLogger.error(message + (error ? `\n${error.stack}` : ''));
	}

	public warn(message: string): void {
		this.winstonLogger.warn(message);
	}

	public info(message: string): void {
		this.winstonLogger.info(message);
	}

	public debug(message: string): void {
		this.winstonLogger.debug(message);
	}
}

export const logger = Logger.getInstance();
