import { Command } from '../command';

// TODO: substitute with setLoginInfo or remove

export class CommandLogin extends Command {
	public override id = 'auth:login';

	public username!: string;

	public password!: string;

	public override execute() {}

	public override toString() {
		return `Login ${this.username}:${this.password}`;
	}
}
