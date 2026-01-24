import { auras } from "~/lib/stores/aura";
import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerAurasLessThan extends ConditionCommand {
  public player?: string;

  public aura!: string;

  public value!: number;

  public override async getCondition(): Promise<boolean> {
    const player = this.bot.world.players.getByName(
      this.player ?? this.bot.auth.username,
    );
    if (!player) return false;
    const aura = auras.players.getAura(player.data.entID, this.aura);
    return (aura?.value ?? 0) < this.value;
  }

  public override toString() {
    return `${this.player ?? "This player"} aura less than: {${this.aura}, ${this.value}}`;
  }
}
