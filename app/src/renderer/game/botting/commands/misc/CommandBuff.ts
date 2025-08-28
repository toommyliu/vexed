import { Command } from "@botting/command";

const SKILL_IDS = [1, 2, 3];

export class CommandBuff extends Command {
  public skills!: number[];

  public override async execute() {
    if (!this.skills?.length) this.skills = SKILL_IDS;

    for (const skillIdx of this.skills) {
      console.log(`use skill: ${skillIdx}`);
      await this.bot.combat.useSkill(skillIdx, true);
      await this.bot.sleep(1_000);
    }
  }

  public override toString(): string {
    if (this.skills?.length) {
      return `Buff: ${this.skills.join(", ")}`;
    }

    return "Buff";
  }
}
