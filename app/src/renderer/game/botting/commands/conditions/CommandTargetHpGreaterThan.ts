import { ConditionCommand } from "./ConditionCommand";

export class CommandTargetHealthGreaterThan extends ConditionCommand {
  public hp!: number;

  public override async getCondition(): Promise<boolean> {
    return ((this.bot.combat?.target?.hp as number) ?? 0) > this.hp;
  }

  public override toString() {
    return `Target HP greater than: ${this.hp}`;
  }
}
