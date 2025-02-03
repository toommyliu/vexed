import { Command } from '../command';

export class KillCommand extends Command {
	public override id = 'combat:kill';

	public target!: string;

	public override async execute(): Promise<void> {
		await this.bot.combat.kill(this.target);
	}

	public override toString() {
		return 'Kill';
	}
}
