import { Command } from '../../command';

// TODO: implement options

export class CommandKill extends Command {
  public target!: string;

  public override async execute(): Promise<void> {
    await this.bot.combat.kill(this.target);
  }

  public override toString() {
    return `Kill: ${this.target}`;
  }
}
