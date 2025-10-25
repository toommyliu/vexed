import { Command } from "@botting/command";

export class CommandDeposit extends Command {
  public item!: (number | string)[] | number | string;

  public override async execute() {
    const items = Array.isArray(this.item) ? this.item : [this.item];
    for (const item of items) {
      this.logger.debug(`Depositing: ${item}`);
      await this.bot.bank.deposit(item);
    }
  }

  public override toString() {
    return `Deposit: ${Array.isArray(this.item) ? this.item.join(", ") : this.item}`;
  }
}
