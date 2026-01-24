import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerHpPercentageGreaterThan extends ConditionCommand {
  public player?: string;

  public percentage!: number;

  public override async getCondition(): Promise<boolean> {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    return !avatar?.isHpPercentageLessThan(this.percentage);
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is greater than: ${this.percentage}%`;
  }
}
