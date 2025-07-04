import { Command } from "../../command";

export class CommandArmyInit extends Command {
  public override skipDelay = true;

  public override async execute() {
    await this.bot.army.init();

    if (!this.bot.army.isInitialized) {
      await this.ctx.stop();
      // eslint-disable-next-line no-alert
      alert("Army init failed.");
    }
  }

  public override toString() {
    return "Army init";
  }
}
