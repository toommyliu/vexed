import { ConditionCommand } from "./ConditionCommand";

export class CommandNotInTemp extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition() {
    return !this.bot.tempInventory.contains(this.item, this.qty);
  }

  public override toString() {
    return `Is not in temp inventory: ${this.item} [x${this.qty}]`;
  }
}
