import { ConditionCommand } from "./ConditionCommand";

export class CommandInBank extends ConditionCommand {
  public item!: string;

  public qty?: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.bank.contains(this.item, this.qty);
  }

  public override toString() {
    return `Item is in bank: ${this.item}${this.qty ? ` [x${this.qty}]` : ""}`;
  }
}
