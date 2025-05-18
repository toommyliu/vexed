import { Command } from "../../command";

export class CommandMonsterNotInRoom extends Command {
  public monster!: string;

  public override execute() {
    if (this.bot.world.isMonsterAvailable(this.monster)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Monster is not in room: ${this.monster}`;
  }
}
