import { Command } from "../../command";

export class CommandMonsterHpGreaterThan extends Command {
  public override skipDelay = true;

  public monster!: string;

  public health!: number;

  public override execute() {
    const mon = this.bot.world.availableMonsters.find(
      (mon) => mon.name.toLowerCase() === this.monster.toLowerCase(),
    );

    if ((mon?.hp ?? 0) < this.health) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.monster}'s HP greater than: ${this.health}`;
  }
}
