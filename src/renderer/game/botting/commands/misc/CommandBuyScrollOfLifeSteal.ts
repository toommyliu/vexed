import { Command } from "../../command";

const ITEM = "Scroll of Life Steal";
const MAX_QTY = 99;

export class CommandBuyScrollOfLifeSteal extends Command {
  public qty!: number;

  public override async execute() {
    if (this.bot.inventory.contains(ITEM, MAX_QTY)) {
      return;
    }

    const currentQty = this.bot.inventory.get(ITEM)?.quantity ?? 0;
    const count = Math.min(
      this.qty -
        currentQty /* how many of the item needed to reach the desired qty */,
      MAX_QTY -
        currentQty /* how many of the item before reaching the max qty */,
    );

    if (count <= 0) {
      return;
    }

    await this.bot.world.join("arcangrove", "Potion", "Right");
    await this.bot.shops.load("211");

    await this.bot.shops.buyByName(ITEM, count);
  }

  public override toString() {
    return `Buy Scroll of Life Steal: ${this.qty}`;
  }
}
