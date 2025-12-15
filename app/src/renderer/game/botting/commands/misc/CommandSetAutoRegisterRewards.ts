import { Command } from "~/botting/command";

export class CommandSetAutoRegisterRewards extends Command {
  public val!: boolean;

  public override executeImpl() {
    this.bot.environment.autoRegisterRewards = this.val;
  }

  public override toString() {
    return `[Environment] Set auto register rewards: ${this.val}`;
  }
}
