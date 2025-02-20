import { Command } from '../../command';

// TODO: substitute with setLoginInfo or remove

export class CommandLogin extends Command {
	public username!: string;

	public password!: string;

	public override execute() {}

	public override toString() {
		return 'Login';
	}
}
