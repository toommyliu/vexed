import { Command } from "@botting/command";

export class CommandWaitForPlayerCount extends Command {
  public count!: number;

  public override async executeImpl() {
    if (this.bot.world.playerNames.length !== this.count) {
      this.ctx.commandIndex--;
    }
  }

  public override toString() {
    return `Wait for player count: ${this.count}`;
  }
}
