import { Command } from '../../command';

export class CommandUseSkill extends Command {
  public skill!: number | string;

  public wait = false;

  public force = false;

  public override async execute(): Promise<void> {
    await this.bot.combat.useSkill(this.skill, this.wait, this.force);
  }

  public override toString() {
    return `${this.force ? 'Force use' : 'Use'} skill: ${this.skill}${this.wait ? ' (wait)' : ''}`;
  }
}
