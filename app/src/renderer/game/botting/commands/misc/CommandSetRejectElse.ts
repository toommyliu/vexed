import { Command } from "@botting/command";

export class CommandSetRejectElse extends Command {
  public val!: boolean;

  public override execute() {
    this.bot.environment.rejectElse = this.val;
  }

  public override toString() {
    return `[Environment] Set reject else: ${this.val}`;
  }
}
