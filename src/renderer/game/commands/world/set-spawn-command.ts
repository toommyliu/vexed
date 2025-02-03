import { Command } from '../command';

export class SetSpawnCommand extends Command {
	public override id = 'world:set-spawn';

	public override execute(cell?: string, pad?: string) {
		this.bot.world.setSpawnPoint(cell, pad);
	}
}
