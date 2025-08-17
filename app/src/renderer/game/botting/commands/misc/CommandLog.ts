import { Command } from "@botting/command";

export class CommandLog extends Command {
  public msg!: string;

  public level!: string;

  public override execute() {
    // moderator
    // server
    // warning
    this.bot.packets.sendClient(`%xt%warning%-1%${this.msg}%`);
  }

  public override toString() {
    return `Log message [${this.level}]`;
  }
}
