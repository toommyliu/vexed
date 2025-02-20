import { Command } from '../../command';

export class CommandMapIs extends Command {
	public map!: string;

	public override execute() {
		if (this.bot.world.name.toLowerCase() !== this.map.toLowerCase()) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `Map is: ${this.map}`;
	}
}
