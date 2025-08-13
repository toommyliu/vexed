import { Command } from "@botting/command";

export class CommandHouse extends Command {
  public player?: string;

  public override async execute() {
    await this.bot.combat.exit();
    this.bot.packets.sendServer(
      `%xt%zm%house%1%${this.player ?? this.bot.auth.username}%`,
    );
  }

  public override toString() {
    return `Goto house${this.player ? `: ${this.player}` : ""}`;
  }
}
