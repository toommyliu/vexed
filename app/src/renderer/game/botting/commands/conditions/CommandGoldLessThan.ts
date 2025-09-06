import { ConditionCommand } from "./ConditionCommand";

export class CommandGoldLessThan extends ConditionCommand {
  public gold!: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.player.gold < this.gold;
  }

  public override toString() {
    return `Gold is less than: ${this.gold}`;
  }
}
