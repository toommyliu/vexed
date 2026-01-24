import { Command } from "../../command";

export class CommandRest extends Command {
  public full = false;

  public override async executeImpl() {
    await this.bot.combat.rest(this.full, true);
  }

  public override toString() {
    return `Rest${this.full ? " fully" : ""}`;
  }
}
