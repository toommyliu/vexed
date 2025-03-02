import { Command } from '../../command';

export class CommandWaitForPlayerCount extends Command {
  public count!: number;

  public override async execute() {
    while (this.bot.world.playerNames.length !== this.count) {
      await this.bot.sleep(100);
    }
  }

  public override toString() {
    return `Wait for player count: ${this.count}`;
  }
}
