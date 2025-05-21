import { Command } from "../../command";

export class CommandRegisterDrop extends Command {
  public item!: string[] | string;

  public rejectElse?: boolean;

  public override execute() {
    const items = Array.isArray(this.item) ? this.item : [this.item];
    for (const item of items) {
      this.ctx.registerDrop(item, this.rejectElse);
    }
  }

  public override toString() {
    return `Register drop: ${Array.isArray(this.item) ? this.item.join(", ") : this.item}`;
  }
}
