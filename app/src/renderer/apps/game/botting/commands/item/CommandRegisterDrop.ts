import { Command } from "../../command";

export class CommandRegisterDrop extends Command {
  public item!: string[];

  public override executeImpl() {
    for (const item of this.item) {
      this.bot.environment.addItemName(item);
      this.logger.debug(`Register drop: ${item}`);
    }
  }

  public override toString() {
    if (this.item.length === 1) {
      return `Register drop: ${this.item[0]}`;
    }

    return `Register drops: ${this.item.join(", ")}`;
  }
}
