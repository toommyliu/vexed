import { Command } from '../command';

export class CommandUseSkill extends Command {
	public skill!: number | string;

	public override async execute(): Promise<void> {
		await this.bot.combat.useSkill(this.skill);
	}

	public override toString() {
		return `Use skill: ${this.skill}`;
	}
}
