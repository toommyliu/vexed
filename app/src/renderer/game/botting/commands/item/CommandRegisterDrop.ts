import { Command } from "@botting/command";

export class CommandRegisterDrop extends Command {
  public item!: string[];

  public rejectElse?: boolean;

  public override executeImpl() {
    for (const item of this.item) {
      this.bot.environment.addItemName(item, this.rejectElse);
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
