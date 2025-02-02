import { Command } from '../command';

export class StopCommand extends Command {
	public override id = 'bot:stop';

	public override execute() {
		if ('queue' in this.bot) {
			logger.info('stopping bot.');
			// @ts-expect-error don't care.
			this.bot.queue.stop();
		} else {
			logger.info('bot.queue is unknown.');
		}
	}
}
