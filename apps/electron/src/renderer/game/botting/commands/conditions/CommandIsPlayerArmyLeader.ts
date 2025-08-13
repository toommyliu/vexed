import { Command } from "../../command";

export class CommandIsPlayerArmyLeader extends Command {
  public override async execute() {
    if (!this.bot.army.isInitialized) {
      return;
    }

    if (!this.bot.army.isLeader()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return "Is player army leader";
  }
}
