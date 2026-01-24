import { Command } from "../../command";

export class CommandCloseWindow extends Command {
  public override async executeImpl() {
    window.close();
  }

  public override toString() {
    return "Close window";
  }
}
