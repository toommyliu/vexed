import { Command } from '../command';

export class MoveToCellCommand extends Command {
	public override id = 'world:move-to-cell';

	public override async execute(cell: string, pad = 'Spawn') {
		await this.bot.world.jump(cell, pad);
	}
}
