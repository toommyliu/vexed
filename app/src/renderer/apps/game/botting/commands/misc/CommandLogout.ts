import { Command } from "../../command";

export class CommandLogout extends Command {
  public override executeImpl() {
    if (!this.bot.auth.isLoggedIn()) return;

    this.bot.auth.logout();
  }

  public override toString() {
    return "Logout";
  }
}
