import { ConditionCommand } from "./ConditionCommand";

export class CommandFactionRankLessThan extends ConditionCommand {
  public faction!: string;

  public rank!: number;

  public override async getCondition(): Promise<boolean> {
    const faction = this.bot.player.factions.find(
      (faction) => faction.name.toLowerCase() === this.faction.toLowerCase(),
    );

    return (faction?.rank ?? 0) <= this.rank;
  }

  public override toString() {
    return `${this.faction} rank less than: ${this.rank}`;
  }
}
