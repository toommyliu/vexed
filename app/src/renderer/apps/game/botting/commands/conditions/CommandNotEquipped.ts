import { ConditionCommand } from "./ConditionCommand";

export class CommandNotEquipped extends ConditionCommand {
  public item!: string;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.inventory.get(this.item)?.isEquipped();
  }

  public override toString() {
    return `Item is not equipped: ${this.item}`;
  }
}
