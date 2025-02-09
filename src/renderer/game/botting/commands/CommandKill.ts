import { Command } from '../command';

// TODO: implement options

export class CommandKill extends Command {
	public override id = 'combat:kill';

	public target!: string;

	public override async execute(): Promise<void> {
		await this.bot.combat.kill(this.target);
	}

	public override toString() {
		return 'Kill';
	}
}
