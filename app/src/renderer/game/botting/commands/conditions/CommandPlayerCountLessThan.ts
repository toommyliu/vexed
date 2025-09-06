import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerCountLessThan extends ConditionCommand {
  public count!: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.world.playerNames.length < this.count;
  }

  public override toString() {
    return `Player count is less than: ${this.count}`;
  }
}
