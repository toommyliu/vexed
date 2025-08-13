import { Command } from "@botting/command";

export class CommandExitCombat extends Command {
  public override async execute(): Promise<void> {
    await this.bot.combat.exit();
  }

  public override toString() {
    return "Exit from combat";
  }
}
