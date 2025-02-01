import kleur from 'kleur';
import winston, { createLogger, format, transports } from 'winston';

export const logger = createLogger({
	level: 'info',
	levels: winston.config.npm.levels,
	transports: [new transports.Console()],
	format: format.combine(
		format.colorize(),
		format.timestamp({ format: 'HH:mm:ss' }),
		format.printf(
			({ level, message, timestamp }) =>
				`[${kleur.blue(timestamp as string)}] (${level}): ${message}`,
		),
	),
});

window.logger = logger;
