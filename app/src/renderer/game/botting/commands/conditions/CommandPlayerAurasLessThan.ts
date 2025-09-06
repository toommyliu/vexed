import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerAurasLessThan extends ConditionCommand {
  public player?: string;

  public aura!: string;

  public value!: number;

  public override async getCondition(): Promise<boolean> {
    const aura = this.bot.world.players
      ?.get((this.player ?? this.bot.auth.username).toLowerCase())
      ?.getAura(this.aura);

    return (aura?.value ?? 0) < this.value;
  }

  public override toString() {
    return `${this.player ?? "This player"} aura less than: {${this.aura}, ${this.value}}`;
  }
}
