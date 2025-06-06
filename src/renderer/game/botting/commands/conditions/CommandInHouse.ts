import { Command } from "../../command";

export class CommandInHouse extends Command {
  public item!: string;

  public qty = 1;

  public override skipDelay = true;

  public override execute() {
    if ((this.bot.house.get(this.item)?.quantity ?? 0) <= this.qty) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not in house: ${this.item} [x${this.qty}]`;
  }
}
