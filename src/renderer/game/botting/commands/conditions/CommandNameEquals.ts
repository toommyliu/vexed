import { Command } from '../../command';

export class CommandNameEquals extends Command {
  public name!: string;

  public override execute() {
    if (this.bot.auth.username.toLowerCase() !== this.name.toLowerCase()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player name equals: ${this.name}`;
  }
}
