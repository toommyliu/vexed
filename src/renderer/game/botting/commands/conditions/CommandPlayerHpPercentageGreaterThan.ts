import { Command } from "../../command";

export class CommandPlayerHpPercentageGreaterThan extends Command {
  public player?: string;

  public percentage!: number;

  public override execute() {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    if (avatar?.isHpPercentageLessThan(this.percentage)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is greater than: ${this.percentage}%`;
  }
}
