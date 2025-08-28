import { Command } from "@botting/command";

export class CommandMonsterNotInRoom extends Command {
  public monster!: string;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.world.isMonsterAvailable(this.monster)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Monster is not in room: ${this.monster}`;
  }
}
