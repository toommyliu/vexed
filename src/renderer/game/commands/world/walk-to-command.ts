import { Command } from '../command';

export class WalkToCommand extends Command {
	public override id = 'world:walk-to';

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
		return `Walk to point: (${this.x}, ${this.y})`;
	}
}
