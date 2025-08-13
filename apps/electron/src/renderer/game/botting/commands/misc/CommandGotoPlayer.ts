import { Command } from "../../command";

export class CommandGotoPlayer extends Command {
  public playerName!: string;

  public override async execute() {
    this.bot.world.goto(this.playerName);
  }

  public override toString() {
    return `Goto player: ${this.playerName}`;
  }
}
