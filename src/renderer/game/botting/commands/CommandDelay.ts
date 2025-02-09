import { Command } from '../command';

export class CommandDelay extends Command {
	public override id = 'misc:delay';

	public delay!: number;

	public override async execute() {
		await this.bot.sleep(this.delay);
	}
}
