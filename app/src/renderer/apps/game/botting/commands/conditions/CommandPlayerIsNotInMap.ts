import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerIsNotInMap extends ConditionCommand {
  public player!: string;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.world.playerNames.includes(this.player.toLowerCase());
  }

  public override toString() {
    return `Player is not in map${this.player ? `: ${this.player}` : ""}`;
  }
}
