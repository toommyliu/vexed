import winston, { createLogger, format, transports } from 'winston';

export const logger = createLogger({
	level: 'info',
	levels: winston.config.npm.levels,
	transports: [new transports.Console()],
	format: format.combine(
		format.colorize({
			colors: {
				info: 'green',
				warn: 'cyan',
				error: 'red',
			},
		}),
		format.timestamp({ format: 'HH:mm:ss' }),
		format.printf(
			({ level, message, timestamp }) =>
				`[${timestamp}] (${level}): ${message}`,
		),
	),
});

window.logger = logger;
