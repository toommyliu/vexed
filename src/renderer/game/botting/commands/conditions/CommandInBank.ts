import { Command } from "../../command";

export class CommandInBank extends Command {
  public item!: string;

  public qty?: number;

  public override skipDelay = true;

  public override execute() {
    if (!this.bot.bank.contains(this.item, this.qty)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is in bank: ${this.item}${this.qty ? ` [x${this.qty}]` : ""}`;
  }
}
