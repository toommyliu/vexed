import { Command } from '../command';

export class AcceptCommand extends Command {
	public override id = 'quest:accept';

	public questId!: number;

	public override async execute(): Promise<void> {
		await this.bot.quests.accept(this.questId);
	}

	public override toString() {
		return `Accept quest ${this.questId}`;
	}
}
