import { Command } from '../command';

export class RestCommand extends Command {
	public override id = 'combat:rest';

	public override async execute(): Promise<void> {
		await this.bot.combat.rest();
	}
}
