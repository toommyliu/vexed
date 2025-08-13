import { Command } from "@botting/command";

export class CommandRegisterBoost extends Command {
  public item!: string;

  public override execute() {
    this.ctx.registerBoost(this.item);
  }

  public override toString() {
    return `Register boost: ${this.item}`;
  }
}
