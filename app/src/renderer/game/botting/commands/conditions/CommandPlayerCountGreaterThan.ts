import { Command } from "@botting/command";

export class CommandPlayerCountGreaterThan extends Command {
  public count!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.world.playerNames.length <= this.count) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player count is greater than: ${this.count}`;
  }
}
