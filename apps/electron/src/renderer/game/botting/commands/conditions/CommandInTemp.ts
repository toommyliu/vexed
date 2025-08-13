import { Command } from "../../command";

export class CommandInTemp extends Command {
  public item!: string;

  public qty = 1;

  public override skipDelay = true;

  public override execute() {
    if ((this.bot.tempInventory.get(this.item)?.quantity ?? 0) <= this.qty) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Is in temp: ${this.item} [x${this.qty}]`;
  }
}
