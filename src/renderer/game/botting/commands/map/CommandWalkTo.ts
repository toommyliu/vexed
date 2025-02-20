import { Command } from '../../command';

export class CommandWalkTo extends Command {
	public x!: number;

	public y!: number;

	public override async execute() {
		this.bot.player.walkTo(this.x, this.y);
		await this.bot.waitUntil(() => {
			const position = this.bot.player.position;
			return position[0] === this.x && position[1] === this.y;
		});
	}

	public override toString() {
		return `Walk to: (${this.x}, ${this.y})`;
	}
}
