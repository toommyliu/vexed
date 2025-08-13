import { Command } from "@botting/command";

export class CommandGoldGreaterThan extends Command {
  public gold!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.gold <= this.gold) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Gold is greater than: ${this.gold}`;
  }
}
