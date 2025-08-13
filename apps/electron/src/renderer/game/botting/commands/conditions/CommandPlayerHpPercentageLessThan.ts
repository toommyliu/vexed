import { Command } from "../../command";

export class CommandPlayerHpPercentageLessThan extends Command {
  public override skipDelay = true;

  public player?: string;

  public percentage!: number;

  public override execute() {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    if (avatar?.isHpPercentageGreaterThan(this.percentage)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is less than: ${this.percentage}%`;
  }
}
