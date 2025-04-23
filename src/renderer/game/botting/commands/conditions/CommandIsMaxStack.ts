import { Command } from "../../command";

export class CommandIsMaxStack extends Command {
  public item!: string;

  public override execute() {
    if (!this.bot.inventory.get(this.item)?.isMaxed()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is maxed out: ${this.item}`;
  }
}
