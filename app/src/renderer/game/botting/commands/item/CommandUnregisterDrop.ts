import { Command } from "@botting/command";

export class CommandUnregisterDrop extends Command {
  public item!: string[];

  public override execute() {
    for (const item of this.item) {
      this.ctx.unregisterDrop(item);
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
