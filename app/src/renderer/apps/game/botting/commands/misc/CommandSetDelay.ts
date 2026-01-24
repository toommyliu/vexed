import { Command } from "~/botting/command";

export class CommandSetDelay extends Command {
  public delay!: number;

  public override executeImpl() {
    this.ctx.setCommandDelay(this.delay);
  }

  public override toString() {
    return `Set delay: ${this.delay}ms`;
  }
}
