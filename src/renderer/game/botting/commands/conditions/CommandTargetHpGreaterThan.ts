import { Command } from "../../command";

export class CommandTargetHealthGreaterThan extends Command {
  public hp!: number;

  public override execute() {
    if (((this.bot.combat?.target?.["hp"] as number) ?? 0) < this.hp) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Target HP greater than: ${this.hp}`;
  }
}
