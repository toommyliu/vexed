import { Command } from "../../command";

export class CommandFactionRankGreaterThan extends Command {
  public faction!: string;

  public rank!: number;

  public override skipDelay = true;

  public override execute() {
    const faction = this.bot.player.factions.find(
      (faction) => faction.name.toLowerCase() === this.faction.toLowerCase(),
    );

    if ((faction?.rank ?? 0) < this.rank) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.faction} rank is greater than: ${this.rank}`;
  }
}
