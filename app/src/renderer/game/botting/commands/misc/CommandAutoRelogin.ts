import { Command } from "~/botting/command";
import { autoReloginState } from "~/renderer/game/state.svelte";

export class CommandAutoRelogin extends Command {
  public server?: string;

  protected override _skipDelay = true;

  public override async executeImpl() {
    const username = this.bot.auth.username;
    const password = this.bot.auth.password;
    const server =
      this.server ??
      this.bot.flash.get("objServerInfo.sName", true) ??
      undefined;

    if (!username || !password || !server) {
      this.logger.debug('Invalid credentials');
      return;
    }

    autoReloginState.enable(username, password, server);
    this.logger.debug(
      `Enabled AutoRelogin for ${username} [${server}].`,
    );
  }

  public override toString() {
    return `Enable AutoRelogin${this.server ? ` [${this.server}]` : ""}`;
  }
}
