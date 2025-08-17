import { Command } from "@botting/command";

export class CommandIsPlayerArmyMember extends Command {
  public override async execute() {
    if (!this.bot.army.isInitialized) {
      return;
    }

    if (this.bot.army.isLeader()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return "Is player army member";
  }
}
