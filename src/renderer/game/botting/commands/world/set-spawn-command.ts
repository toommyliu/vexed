import { Command } from '../command';

export class SetSpawnCommand extends Command {
	public override id = 'world:set-spawn';

	public cell?: string;

	public pad?: string;

	public override execute() {
		this.bot.world.setSpawnPoint(this.cell, this.pad);
	}

	public override toString() {
		return `Set spawnpoint${this.cell ? `: ${this.cell}${this.pad ? `:${this.pad}` : ''}` : ''}`;
	}
}
