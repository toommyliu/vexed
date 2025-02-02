import { Command } from '../command';

export class LoginCommand extends Command {
	public override id = 'auth:login';

	public override execute(username: string, password: string) {
		logger.info(`logging in with ${username}:${password}`);
	}
}
