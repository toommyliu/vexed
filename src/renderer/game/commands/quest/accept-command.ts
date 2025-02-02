import { Command } from '../command';

export class AcceptCommand extends Command {
	public override id = 'quest:accept';

	public override async execute(questId: number): Promise<void> {
		await this.bot.quests.accept(questId);
	}
}
