import { Command } from "../../command";

export class CommandTargetHpLessThan extends Command {
  public hp!: number;

  public override skipDelay = true;

  public override execute() {
    if (((this.bot.combat?.target?.hp as number) ?? 0) > this.hp) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Target HP less than: ${this.hp}`;
  }
}
