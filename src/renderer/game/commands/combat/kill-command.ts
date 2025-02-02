import { Command } from '../command';

export class KillCommand extends Command {
	public override id = 'combat:kill';

	public override async execute(monsterName: string): Promise<void> {
		logger.info(`killing ${monsterName}`);
		await this.bot.combat.kill(monsterName);
		logger.info(`killed ${monsterName}`);
	}
}
