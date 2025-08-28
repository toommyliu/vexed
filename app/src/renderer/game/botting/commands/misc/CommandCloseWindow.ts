import { Command } from "@botting/command";

export class CommandCloseWindow extends Command {
  public override async execute() {
    window.close();
  }

  public override toString() {
    return "Close window";
  }
}
