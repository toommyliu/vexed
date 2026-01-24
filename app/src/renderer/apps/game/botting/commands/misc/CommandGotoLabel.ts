import { Command } from "~/botting/command";
import { CommandLabel } from "./CommandLabel";

export class CommandGotoLabel extends Command {
  public label!: string;

  public override executeImpl() {
    const index = this.ctx.commands.findIndex(
      (cmd) =>
        cmd instanceof CommandLabel &&
        cmd.label.toLowerCase() === this.label.toLowerCase(),
    );

    if (index > -1) {
      this.ctx.commandIndex = index;
    }
  }

  public override toString() {
    return `Goto label: ${this.label}`;
  }
}
