import { Command } from "../../command";

export class CommandNotInBank extends Command {
  public item!: string;

  public qty = 1;

  public override execute() {
    if (this.bot.bank.contains(this.item, this.qty)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not in bank: ${this.item} [x${this.qty}]`;
  }
}
