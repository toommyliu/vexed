import { Command } from "../../command";

export class CommandTargetHpBetween extends Command {
  public lower!: number;

  public upper!: number;

  public override execute() {
    if (
      (this.bot.combat.hasTarget() &&
        (this.bot.combat.target?.["hp"] as number) <= this.lower) ||
      (this.bot.combat.target?.["hp"] as number) >= this.upper
    ) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Target HP is between: {${this.lower}, ${this.upper}}`;
  }
}
