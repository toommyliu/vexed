import { Command } from "../../command";

export class CommandPlayerIsNotInMap extends Command {
  public player!: string;

  public override execute() {
    if (this.bot.world.playerNames.includes(this.player.toLowerCase())) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player is not in map${this.player ? `: ${this.player}` : ""}`;
  }
}
