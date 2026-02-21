import { ConditionCommand } from "./ConditionCommand";

export class CommandNotInBank extends ConditionCommand {
  public item!: string;

  public qty = 1;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.bank.contains(this.item, this.qty);
  }

  public override toString() {
    return `Item is not in bank: ${this.item} [x${this.qty}]`;
  }
}
