import { Command } from '../command';

export class CommandLogout extends Command {
	public override execute() {
		if (!this.bot.auth.isLoggedIn()) return;

		this.bot.auth.logout();
	}

	public override toString() {
		return 'Logout';
	}
}
