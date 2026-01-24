import { Command } from "../../command";

const SKILL_IDS = [1, 2, 3];

export class CommandBuff extends Command {
  public skills!: number[];

  public wait!: boolean;

  public override async executeImpl() {
    if (!this.skills?.length) this.skills = SKILL_IDS;

    for (const skillIdx of this.skills) {
      await this.bot.combat.useSkill(skillIdx, true, this.wait);
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
