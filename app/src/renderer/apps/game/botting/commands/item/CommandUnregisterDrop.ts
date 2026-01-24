import { Command } from "../../command";

export class CommandUnregisterDrop extends Command {
  public item!: string[];

  public override executeImpl() {
    for (const item of this.item) {
      this.bot.environment.removeItemName(item);
      this.logger.debug(`Unregister drop: ${item}`);
    }
  }

  public override toString() {
    if (this.item.length === 1) {
      return `Unregister drop: ${this.item[0]}`;
    }

    return `Unregister drops: ${this.item.join(", ")}`;
  }
}
