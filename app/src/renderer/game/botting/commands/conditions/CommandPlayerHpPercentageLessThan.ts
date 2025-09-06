import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerHpPercentageLessThan extends ConditionCommand {
  public player?: string;

  public percentage!: number;

  public override async getCondition(): Promise<boolean> {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    return !avatar?.isHpPercentageGreaterThan(this.percentage);
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is less than: ${this.percentage}%`;
  }
}
