import { Command } from '../command';

export class LogoutCommand extends Command {
	public override id = 'auth:logout';

	public override execute() {
		logger.info('logging out');
		this.bot.auth.logout();
	}
}
