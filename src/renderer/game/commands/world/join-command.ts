import { Command } from '../command';

export class JoinCommand extends Command {
	public override id = 'world:join';

	public override async execute(
		map: string,
		cellToUse = 'Enter',
		padToUse = 'Spawn',
	): Promise<void> {
		logger.info(`join ${map}:${cellToUse}:${padToUse}`);
		await this.bot.world.join(map, cellToUse, padToUse);
		logger.info(`joined ${map}:${cellToUse}:${padToUse}`);
	}
}
