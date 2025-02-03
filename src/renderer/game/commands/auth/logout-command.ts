import { Command } from '../command';

export class LogoutCommand extends Command {
	public override id = 'auth:logout';

	public override execute() {
		this.bot.auth.logout();
	}

	public override toString() {
		return 'Logout';
	}
}
