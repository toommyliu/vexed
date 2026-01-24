import { Command } from "~/botting/command";

export class CommandStopBot extends Command {
  public override async executeImpl() {
    await this.ctx.stop();
  }

  public override toString(): string {
    return "Stop bot";
  }
}
