import { ConditionCommand } from "./ConditionCommand";

export class CommandIsEquipped extends ConditionCommand {
  public item!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.player.inventory.get(this.item)?.isEquipped() ?? false;
  }

  public override toString() {
    return `Is equipped: ${this.item}`;
  }
}
