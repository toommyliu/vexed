import { Command } from "@botting/command";

export class CommandSell extends Command {
  public item!: string;

  public override async executeImpl() {
    await this.bot.shops.sell(this.item);
  }

  public override toString() {
    return `Sell: ${this.item}`;
  }
}
