import { Command } from "../../command";

export class CommandPlayerCountLessThan extends Command {
  public count!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.world.playerNames.length >= this.count) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player count is less than: ${this.count}`;
  }
}
