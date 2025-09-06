import { ConditionCommand } from "./ConditionCommand";

export class CommandNotInHouse extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return (this.bot.house.get(this.item)?.quantity ?? 0) <= this.qty;
  }

  public override toString() {
    return `Item is not in house: ${this.item} [x${this.qty}]`;
  }
}
