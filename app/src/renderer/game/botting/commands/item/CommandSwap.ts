import { Command } from "@botting/command";

export class CommandSwap extends Command {
  public bankItem!: number | string;

  public invItem!: number | string;

  public override async executeImpl() {
    await this.bot.bank.swap(this.bankItem, this.invItem);
  }

  public override toString() {
    return `Swap: ${this.bankItem} [bank] ${this.invItem} [inv]`;
  }
}
