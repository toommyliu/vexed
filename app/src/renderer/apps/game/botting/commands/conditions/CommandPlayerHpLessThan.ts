import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerHpLessThan extends ConditionCommand {
  public player?: string;

  public hp!: number;

  public override async getCondition(): Promise<boolean> {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    return !avatar?.isHpGreaterThan(this.hp);
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is less than: ${this.hp}`;
  }
}
