import { Command } from "../../command";

export class CommandNotInHouse extends Command {
  public item!: string;

  public qty = 1;

  public override execute() {
    if ((this.bot.house.get(this.item)?.quantity ?? 0) <= this.qty) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not in house: ${this.item} [x${this.qty}]`;
  }
}
