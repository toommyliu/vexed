import { Command } from '../../command';

export class CommandAnyPlayerHpPercentageGreaterThan extends Command {
  public percentage!: number;

  public override execute() {
    const anyGreaterThan = this.bot.world.playerNames.every((playerName) => {
      const player = this.bot.world.players?.get(playerName.toLowerCase());
      return player?.isHpPercentageGreaterThan(this.percentage);
    });

    if (!anyGreaterThan) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Any player HP percentage is greater than: ${this.percentage}%`;
  }
}
