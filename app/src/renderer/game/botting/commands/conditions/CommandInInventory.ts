import { ConditionCommand } from "./ConditionCommand";

export class CommandInInventory extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return (this.bot.player.inventory.get(this.item)?.quantity ?? 0) >= this.qty;
  }

  public override toString() {
    return `Item is in inventory: ${this.item} [x${this.qty}]`;
  }
}
