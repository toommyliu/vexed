import { Command } from "~/botting/command";

export class CommandArmyInit extends Command {
  protected override _skipDelay = true;

  public override async executeImpl() {
    await this.bot.army.init();

    if (!this.bot.army.isInitialized) {
      await this.ctx.stop();
    }
  }

  public override toString() {
    return "Army init";
  }
}
