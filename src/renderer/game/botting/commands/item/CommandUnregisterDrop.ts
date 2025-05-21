import { Command } from "../../command";

export class CommandUnregisterDrop extends Command {
  public item!: string[] | string;

  public override execute() {
    const items = Array.isArray(this.item) ? this.item : [this.item];
    for (const item of items) {
      this.ctx.unregisterDrop(item);
    }
  }

  public override toString() {
    return `Unregister drop: ${Array.isArray(this.item) ? this.item.join(", ") : this.item}`;
  }
}
