import { ConditionCommand } from "./ConditionCommand";

export class CommandLevelIsLessThan extends ConditionCommand {
  public level!: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.player.level < this.level;
  }

  public override toString() {
    return `Level is less than: ${this.level}`;
  }
}
