import { Command } from '../../command';

export class CommandPlayerAurasGreaterThan extends Command {
  public aura!: string;

  public value!: number;

  public override execute() {
    const aura = this.bot.world.players
      ?.get(this.bot.auth.username)
      ?.getAura(this.aura);

    if ((aura?.value ?? 0) <= this.value) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player aura greater than: {${this.aura}, ${this.value}}`;
  }
}
