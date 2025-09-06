import { ConditionCommand } from "./ConditionCommand";

export class CommandIsPlayerNumber extends ConditionCommand {
  public playerNumber!: number;

  public override async getCondition(): Promise<boolean> {
    return (
      this.bot.army.isInitialized &&
      this.bot.army.getPlayerNumber() === this.playerNumber
    );
  }

  public override toString() {
    return `Is player number: ${this.playerNumber}`;
  }
}
