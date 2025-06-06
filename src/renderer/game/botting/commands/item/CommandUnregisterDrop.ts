import { Command } from "../../command";

export class CommandUnregisterDrop extends Command {
  public item!: string[];

  public override execute() {
    for (const item of this.item) {
      this.ctx.unregisterDrop(item);
    }
  }

  public override toString() {
    if (this.item.length === 1) {
      return `Unregister drop: ${this.item[0]}`;
    }

    return `Unregister drops: ${this.item.join(", ")}`;
  }
}
