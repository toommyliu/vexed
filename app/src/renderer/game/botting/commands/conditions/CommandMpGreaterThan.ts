import { ConditionCommand } from "./ConditionCommand";

export class CommandMpGreaterThan extends ConditionCommand {
  public mana!: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.player.mp > this.mana;
  }

  public override toString() {
    return `MP is greater than: ${this.mana}`;
  }
}
