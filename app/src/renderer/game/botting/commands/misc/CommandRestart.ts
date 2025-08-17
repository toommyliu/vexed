import { Command } from "@botting/command";

export class CommandRestart extends Command {
  public override async execute(): Promise<void> {
    this.ctx.commandIndex = 0;
  }

  public override toString() {
    return "Restart Bot";
  }
}
