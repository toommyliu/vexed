import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerNameIs extends ConditionCommand {
  public player!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.auth.username.toLowerCase() === this.player.toLowerCase();
  }

  public override toString() {
    return `This player name is: ${this.player}`;
  }
}
