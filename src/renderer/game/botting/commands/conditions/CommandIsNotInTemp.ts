import { Command } from "../../command";

export class CommandIsNotInTemp extends Command {
  public item!: string;

  public qty = 1;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.tempInventory.contains(this.item, this.qty)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Is not in temp inventory: ${this.item} [x${this.qty}]`;
  }
}
