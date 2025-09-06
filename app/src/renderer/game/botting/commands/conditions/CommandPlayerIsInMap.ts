import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerIsInMap extends ConditionCommand {
  public player!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.world.playerNames.includes(this.player.toLowerCase());
  }

  public override toString() {
    return `Player is in map: ${this.player}`;
  }
}
