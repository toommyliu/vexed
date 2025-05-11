import { Command } from "../../command";

export class CommandPlayerIsInMap extends Command {
  public player!: string;

  public override execute() {
    if (!this.bot.world.playerNames.includes(this.player.toLowerCase())) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player is in map: ${this.player}`;
  }
}
