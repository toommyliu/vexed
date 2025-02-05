import { Command } from '../command';

export class LogoutCommand extends Command {
	public override id = 'auth:logout';

	public override execute() {
		if (!this.bot.auth.isLoggedIn()) return;

		this.bot.auth.logout();
	}

	public override toString() {
		return 'Logout';
	}
}
