import { Command } from '../../command';

export class CommandMapIsNot extends Command {
	public map!: string;

	public override execute() {
		if (this.bot.world.name.toLowerCase() === this.map.toLowerCase()) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `Map is not: ${this.map}`;
	}
}
