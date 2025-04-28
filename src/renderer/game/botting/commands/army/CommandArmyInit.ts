import { Logger } from "../../../../../common/logger";
import { Command } from "../../command";

const logger = Logger.get("");

export class CommandArmyInit extends Command {
  public override async execute() {
    await this.bot.army.init();

    logger.info("Army failed to initialize");
    if (!this.bot.army.isInitialized) {
      await this.ctx.stop();
    }
  }

  public override toString() {
    return "Army init";
  }
}
