import { Command } from "../../command";

export class CommandArmyInit extends Command {
  public override async execute() {
    await this.bot.army.init();

    if (!this.bot.army.isInitialized) {
      await this.ctx.stop();
    }
  }

  public override toString() {
    return "Army init";
  }
}
