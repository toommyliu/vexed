import { Command } from "../../command";

export class CommandWaitForPlayerCount extends Command {
  public count!: number;

  public exact!: boolean;

  public override async executeImpl() {
    const goBack =
      (this.exact && this.bot.world?.playerNames?.length !== this.count) ||
      (!this.exact && this.bot.world?.playerNames?.length < this.count);

    if (goBack) this.ctx.commandIndex--;
  }

  public override toString() {
    return `Wait for player count: ${this.count}${this.exact ? " [exact]" : ""}`;
  }
}
