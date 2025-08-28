import { Command } from "@botting/command";

export class CommandPlayerAurasLessThan extends Command {
  public override skipDelay = true;

  public player?: string;

  public aura!: string;

  public value!: number;

  public override execute() {
    const aura = this.bot.world.players
      ?.get((this.player ?? this.bot.auth.username).toLowerCase())
      ?.getAura(this.aura);

    if ((aura?.value ?? 0) >= this.value) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} aura less than: {${this.aura}, ${this.value}}`;
  }
}
