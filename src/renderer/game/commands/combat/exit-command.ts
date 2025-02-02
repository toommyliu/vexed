import { Command } from '../command';

export class ExitCommand extends Command {
	public override id = 'combat:exit';

	public override async execute(): Promise<void> {
		await this.bot.combat.exit(true);
	}
}
