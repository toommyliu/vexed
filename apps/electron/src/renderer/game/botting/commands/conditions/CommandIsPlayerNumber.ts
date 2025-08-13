import { Command } from "../../command";

export class CommandIsPlayerNumber extends Command {
  public playerNumber!: number;

  public override async execute() {
    if (!this.bot.army.isInitialized) {
      return;
    }

    if (this.bot.army.getPlayerNumber() !== this.playerNumber) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Is player number: ${this.playerNumber}`;
  }
}
