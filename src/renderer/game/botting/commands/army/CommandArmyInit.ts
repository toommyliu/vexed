import { Command } from "../../command";

export class CommandArmyInit extends Command {
  public override async execute() {
    await this.bot.army.init();
  }

  public override toString() {
    return "Army init";
  }
}
