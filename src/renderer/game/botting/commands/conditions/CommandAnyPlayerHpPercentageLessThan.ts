import { Command } from '../../command';

export class CommandAnyPlayerHpPercentageLessThan extends Command {
  public percentage!: number;

  public override execute() {
    const anyLessThan = this.bot.world.playerNames.every((playerName) => {
      const player = this.bot.world.players?.get(playerName.toLowerCase());
      return player?.isHpPercentageLessThan(this.percentage);
    });

    if (!anyLessThan) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Any player HP percentage less than: ${this.percentage}%`;
  }
}
