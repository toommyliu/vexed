import { ConditionCommand } from "./ConditionCommand";

export class CommandIsMaxStack extends ConditionCommand {
  public item!: string;

  public override async getCondition() {
    return this.bot.player.inventory.get(this.item)?.isMaxed() ?? false;
  }

  public override toString() {
    return `Item is maxed out: ${this.item}`;
  }
}
