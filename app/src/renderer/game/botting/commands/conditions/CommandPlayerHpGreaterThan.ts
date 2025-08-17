import { Command } from "@botting/command";

export class CommandPlayerHpGreaterThan extends Command {
  public override skipDelay = true;

  public player?: string;

  public hp!: number;

  public override execute() {
    const avatar = this.bot.world.players?.get(
      (this.player ?? this.bot.auth.username).toLowerCase(),
    );

    if (avatar?.isHpLessThan(this.hp)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} HP is greater than: ${this.hp}`;
  }
}
