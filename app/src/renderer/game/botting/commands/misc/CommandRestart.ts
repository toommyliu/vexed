import { Command } from "@botting/command";

export class CommandRestart extends Command {
  public override executeImpl() {
    this.ctx.commandIndex = 0;
  }

  public override toString() {
    return "Restart Bot";
  }
}
