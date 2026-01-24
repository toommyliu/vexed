import { ConditionCommand } from "./ConditionCommand";

export class CommandInHouse extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return (this.bot.house.get(this.item)?.quantity ?? 0) >= this.qty;
  }

  public override toString() {
    return `Item is in house: ${this.item} [x${this.qty}]`;
  }
}
