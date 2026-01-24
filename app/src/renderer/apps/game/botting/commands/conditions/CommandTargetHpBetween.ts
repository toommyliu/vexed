import { ConditionCommand } from "./ConditionCommand";

export class CommandTargetHpBetween extends ConditionCommand {
  public lower!: number;

  public upper!: number;

  public override async getCondition(): Promise<boolean> {
    if (!this.bot.combat.hasTarget()) {
      return false;
    }

    const targetHp = this.bot.combat.target?.hp as number;
    return targetHp > this.lower && targetHp < this.upper;
  }

  public override toString() {
    return `Target HP is between: {${this.lower}, ${this.upper}}`;
  }
}
