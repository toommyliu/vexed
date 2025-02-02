import { Command } from '../command';

export class SkillCommand extends Command {
	public override id = 'combat:skill';

	public override async execute(skill: string): Promise<void> {
		await this.bot.combat.useSkill(skill);
	}
}
