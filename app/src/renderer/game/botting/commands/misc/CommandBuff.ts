import { Command } from "@botting/command";

const SKILL_IDS = [1, 2, 3];

export class CommandBuff extends Command {
  public override async execute() {
    for (const skillId of SKILL_IDS) {
      await this.bot.combat.useSkill(skillId, true);
      await this.bot.sleep(1_000);
    }
  }

  public override toString(): string {
    return "Buff";
  }
}
