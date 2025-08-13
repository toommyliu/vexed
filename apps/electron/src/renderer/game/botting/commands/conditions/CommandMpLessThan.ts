import { Command } from "../../command";

export class CommandMpLessThan extends Command {
  public mana!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.mp >= this.mana) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `MP is less than: ${this.mana}`;
  }
}
