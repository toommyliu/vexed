import { ConditionCommand } from "./ConditionCommand";

export class CommandAnyPlayerHpPercentageLessThan extends ConditionCommand {
  public percentage!: number;

  public override async getCondition() {
    return this.bot.world.playerNames.every((playerName) => {
      const player = this.bot.world.players?.get(playerName);
      return player?.isHpPercentageLessThan(this.percentage);
    });
  }

  public override toString() {
    return `Any player HP less than: ${this.percentage}%`;
  }
}
