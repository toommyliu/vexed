import { Command } from "../../command";

export class CommandSetAutoRegisterRequirements extends Command {
  public val!: boolean;

  public override executeImpl() {
    this.bot.environment.autoRegisterRequirements = this.val;
  }

  public override toString() {
    return `[Environment] Set auto register requirements: ${this.val}`;
  }
}
