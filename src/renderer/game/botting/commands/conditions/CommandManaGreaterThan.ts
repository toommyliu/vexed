import { Command } from '../../command';

export class CommandManaGreaterThan extends Command {
	public mana!: number;

	public override execute() {
		if (this.bot.player.mp <= this.mana) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `Mana is greater than: ${this.mana}`;
	}
}
