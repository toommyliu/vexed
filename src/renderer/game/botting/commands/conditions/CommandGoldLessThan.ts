import { Command } from "../../command";

export class CommandGoldLessThan extends Command {
  public gold!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.gold >= this.gold) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Gold is less than: ${this.gold}`;
  }
}
