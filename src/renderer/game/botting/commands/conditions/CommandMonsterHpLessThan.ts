import { Command } from "../../command";

export class CommandMonsterHpLessThan extends Command {
  public monster!: string;

  public health!: number;

  public override execute() {
    const mon = this.bot.world.availableMonsters.find(
      (mon) => mon.name.toLowerCase() === this.monster.toLowerCase(),
    );

    if ((mon?.hp ?? 0) > this.health) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.monster}'s HP less than: ${this.health}`;
  }
}
