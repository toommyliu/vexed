import { Command } from "@botting/command";

export class CommandIsEquipped extends Command {
  public item!: string;

  public override skipDelay = true;

  public override execute() {
    if (!this.bot.inventory.get(this.item)?.isEquipped()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Is equipped: ${this.item}`;
  }
}
