import { Command } from "~/botting/command";

export class CommandRegisterBoost extends Command {
  public item!: string;

  public override executeImpl() {
    this.bot.environment.addBoost(this.item);
    this.logger.debug(this.toString());
  }

  public override toString() {
    return `Register boost: ${this.item}`;
  }
}
