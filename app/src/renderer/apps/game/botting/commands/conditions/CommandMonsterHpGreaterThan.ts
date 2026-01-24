import { ConditionCommand } from "./ConditionCommand";

export class CommandMonsterHpGreaterThan extends ConditionCommand {
  public monster!: string;

  public health!: number;

  public override async getCondition(): Promise<boolean> {
    const mon = this.bot.world.availableMonsters.find(
      (mon) => mon.name.toLowerCase() === this.monster.toLowerCase(),
    );

    return (mon?.hp ?? 0) > this.health;
  }

  public override toString() {
    return `${this.monster}'s HP greater than: ${this.health}`;
  }
}
