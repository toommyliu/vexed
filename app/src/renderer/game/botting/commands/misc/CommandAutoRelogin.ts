import { AutoReloginJob } from "@/renderer/game/lib/jobs/autorelogin";
import { Command } from "@botting/command";

export class CommandAutoRelogin extends Command {
  public username?: string;

  public password?: string;

  public server?: string;

  public override skipDelay = true;

  public override execute() {
    const username = this.username ?? this.bot.auth.username;
    const password = this.password ?? this.bot.auth.password;
    const server =
      this.server ??
      this.bot.flash.get("objServerInfo.sName", true) ??
      undefined;

    AutoReloginJob.setCredentials(username, password, server);
    this.logger.debug(
      `Set AutoRelogin for ${username}${server ? ` [${server}]` : ""}.`,
    );
  }

  public override toString() {
    return `Use AutoRelogin: ${this.username} ${this.server ? `[${this.server}]` : ""}`;
  }
}
