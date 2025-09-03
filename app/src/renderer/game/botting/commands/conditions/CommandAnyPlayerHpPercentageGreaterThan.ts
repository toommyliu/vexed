import { ConditionCommand } from "./ConditionCommand";

export class CommandAnyPlayerHpPercentageGreaterThan extends ConditionCommand {
  public percentage!: number;

  public override async getCondition() {
    return this.bot.world.playerNames.some((playerName) => {
      const player = this.bot.world.players?.get(playerName.toLowerCase());
      return player?.isHpPercentageGreaterThan(this.percentage);
    });
  }

  public override toString() {
    return `Any player HP greater than: ${this.percentage}%`;
  }
}
