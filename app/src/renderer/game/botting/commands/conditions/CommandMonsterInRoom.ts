import { ConditionCommand } from "./ConditionCommand";

export class CommandMonsterInRoom extends ConditionCommand {
  public monster!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.world.isMonsterAvailable(this.monster);
  }

  public override toString() {
    return `Monster is in room: ${this.monster}`;
  }
}
