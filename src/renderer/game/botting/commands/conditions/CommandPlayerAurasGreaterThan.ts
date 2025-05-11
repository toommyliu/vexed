import { Command } from "../../command";

export class CommandPlayerAurasGreaterThan extends Command {
  public player?: string;

  public aura!: string;

  public value!: number;

  public override execute() {
    const aura = this.bot.world.players
      ?.get((this.player ?? this.bot.auth.username).toLowerCase())
      ?.getAura(this.aura);

    if ((aura?.value ?? 0) <= this.value) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} aura greater than: {${this.aura}, ${this.value}}`;
  }
}
