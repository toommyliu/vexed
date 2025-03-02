import { Command } from '../../command';

export class CommandMonsterHealthGreaterThan extends Command {
  public monster!: string;

  public health!: number;

  public override execute() {
    const mon = this.bot.world.availableMonsters.find(
      (mon) => mon.name === this.monster,
    );

    if ((mon?.hp ?? -1) < this.health) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.monster}'s HP greater than: ${this.health}`;
  }
}
