import { Command } from "@botting/command";

export class CommandStopBot extends Command {
  public override async execute() {
    await this.ctx.stop();
  }

  public override toString(): string {
    return "Stop bot";
  }
}
