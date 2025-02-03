import { Command } from '../command';

export class WalkToCommand extends Command {
	public override id = 'world:walk-to';

	public override async execute(x: number, y: number) {
		this.bot.player.walkTo(x, y);
		await this.bot.waitUntil(() => {
			const position = this.bot.player.position;
			return position[0] === x && position[1] === y;
		});
	}
}
