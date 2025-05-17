import { Command } from "../../command";

export class CommandRegisterDrop extends Command {
  public item!: string;

  public rejectElse?: boolean;

  public override execute() {
    this.ctx.registerDrop(this.item, this.rejectElse);
  }

  public override toString() {
    return `Register drop: ${this.item}`;
  }
}
