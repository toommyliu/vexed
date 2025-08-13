import { Command } from "../../command";

export class CommandRegisterDrop extends Command {
  public item!: string[];

  public rejectElse?: boolean;

  public override execute() {
    for (const item of this.item) {
      this.ctx.registerDrop(item, this.rejectElse);
    }
  }

  public override toString() {
    if (this.item.length === 1) {
      return `Register drop: ${this.item[0]}`;
    }

    return `Register drops: ${this.item.join(", ")}`;
  }
}
