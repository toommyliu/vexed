import { Command } from "@botting/command";

export class CommandWithdraw extends Command {
  public item!: (number | string)[] | number | string;

  public override async executeImpl() {
    const items = Array.isArray(this.item) ? this.item : [this.item];
    for (const item of items) {
      await this.bot.bank.withdraw(item);
    }
  }

  public override toString() {
    return `Withdraw: ${Array.isArray(this.item) ? this.item.join(", ") : this.item}`;
  }
}
