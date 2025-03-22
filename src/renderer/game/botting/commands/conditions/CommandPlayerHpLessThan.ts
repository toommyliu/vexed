import { Command } from '../../command';

export class CommandPlayerHpLessThan extends Command {
  public player?: string;

  public hp!: number;

  public override execute() {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    if (avatar?.isHpGreaterThan(this.hp)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? 'This player'} HP is less than: ${this.hp}`;
  }
}
