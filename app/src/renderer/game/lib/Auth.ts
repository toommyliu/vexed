import type { Bot } from "./Bot";
import { Server } from "./models/Server";

export class Auth {
  public constructor(public readonly bot: Bot) {}

  /**
   * The username of the current user.
   *
   * @remarks
   * This value is set after a successful login.
   */
  public get username(): string {
    return this.bot.flash.getStatic("loginInfo", true)?.strUsername ?? null;
  }

  /**
   * The password of the current user.
   *
   * @remarks
   * This value is set after a successful login.
   */
  public get password(): string {
    return this.bot.flash.getStatic("loginInfo", true)?.strPassword ?? null;
  }

  /**
   * Whether the user is logged in and connected to a server.
   */
  public isLoggedIn(): boolean {
    return this.bot.flash.call(() => swf.authIsLoggedIn());
  }

  /**
   * Log in with an account.
   *
   * @param username - The username to login with.
   * @param password - The password to login with.
   */
  public login(username: string, password: string): void {
    this.bot.flash.call("removeAllChildren");
    this.bot.flash.call("gotoAndPlay", "Login");
    this.bot.flash.call("login", username, password);
  }

  /**
   * Logs out of the current account.
   */
  public logout(): void {
    this.bot.flash.call(() => swf.authLogout());
  }

  /**
   * The list of servers as shown to the client.
   *
   * @remarks
   * The value is set after a successful login.
   */
  public get servers(): Server[] {
    return swf.authGetServers().map((server) => new Server(server));
  }

  /**
   * Connects to a server.
   *
   * @param name - The name of the server.
   */
  public connectTo(name: string): boolean {
    if (!this.servers.length) {
      throw new Error("No servers available");
    }

    return this.bot.flash.call<boolean>(() => swf.authConnectTo(name));
  }

  /**
   * Whether the client is temporarily kicked from the server.
   */
  public isTemporarilyKicked(): boolean {
    return this.bot.flash.call(() => swf.authIsTemporarilyKicked());
  }
}
