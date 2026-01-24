import { ConditionCommand } from "./ConditionCommand";

export class CommandItemHasDropped extends ConditionCommand {
  public item!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.drops.hasDrop(this.item);
  }

  public override toString() {
    return `Item has dropped: ${this.item}`;
  }
}
