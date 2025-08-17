import { Command } from "@botting/command";

export class CommandItemHasNotDropped extends Command {
  public item!: string;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.drops.hasDrop(this.item)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item has not dropped: ${this.item}`;
  }
}
