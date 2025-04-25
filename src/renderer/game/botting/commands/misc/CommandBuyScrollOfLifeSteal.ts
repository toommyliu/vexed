import { Command } from "../../command";

const ITEM = "Scroll of Life Steal";
const MAX_QTY = 99;

export class CommandBuyScrollOfLifeSteal extends Command {
  public qty!: number;

  public override async execute() {
    if (
      this.bot.inventory.contains(ITEM, this.qty) ||
      this.bot.inventory.contains(ITEM, MAX_QTY)
    ) {
      return;
    }

    const count = this.bot.inventory.get(ITEM)?.quantity ?? 0;

    await this.bot.world.join("arcangrove", "Potion", "Right");
    await this.bot.shops.load("211");

    await this.bot.shops.buyByName(ITEM, MAX_QTY - count);
  }

  public override toString() {
    return `Buy Scroll of Life Steal: ${this.qty}`;
  }
}
