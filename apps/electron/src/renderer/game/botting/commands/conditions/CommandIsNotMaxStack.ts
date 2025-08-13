import { Command } from "@botting/command";

export class CommandIsNotMaxStack extends Command {
  public item!: string;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.inventory.get(this.item)?.isMaxed()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not maxed out: ${this.item}`;
  }
}
