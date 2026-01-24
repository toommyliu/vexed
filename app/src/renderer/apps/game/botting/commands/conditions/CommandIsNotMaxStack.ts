import { ConditionCommand } from "./ConditionCommand";

export class CommandIsNotMaxStack extends ConditionCommand {
  public item!: string;

  protected override _skipDelay = true;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.inventory.get(this.item)?.isMaxed();
  }

  public override toString() {
    return `Item is not maxed out: ${this.item}`;
  }
}
