import { Command } from "@botting/command";

export class CommandUnregisterBoost extends Command {
  public item!: string;

  public override execute() {
    this.ctx.unregisterBoost(this.item);
    this.logger.debug(this.toString());
  }

  public override toString() {
    return `Unregister boost: ${this.item}`;
  }
}
