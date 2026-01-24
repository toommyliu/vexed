import { ConditionCommand } from "./ConditionCommand";

export class CommandNotInInventory extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.inventory.contains(this.item, this.qty);
  }

  public override toString() {
    return `Item is not in inventory: ${this.item} [x${this.qty}]`;
  }
}
