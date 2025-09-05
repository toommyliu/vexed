import { ConditionCommand } from "./ConditionCommand";

export class CommandInTemp extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return (this.bot.tempInventory.get(this.item)?.quantity ?? 0) >= this.qty;
  }

  public override toString() {
    return `Is in temp: ${this.item} [x${this.qty}]`;
  }
}
