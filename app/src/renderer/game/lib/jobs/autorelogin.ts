import { Mutex } from "async-mutex";
import log from "electron-log";
import type { Bot } from "@lib/Bot";
import { Job } from "./Job";

const logger = log.scope("game/AutoRelogin");

/**
 * Auto Relogin attempts a login using the provided username and password, selecting the specified server.
 */
export class AutoReloginJob extends Job {
  private readonly mutex = new Mutex();

  /**
   * The username to login with.
   */
  public static username: string | null;

  /**
   * The password to login with.
   */
  public static password: string | null;

  /**
   * The server name to connect to.
   */
  public static server: string | null;

  /**
   * The delay after which a login attempt is made.
   */
  public static delay: number = 5_000;

  public constructor(private readonly bot: Bot) {
    super("autorelogin", 10);

    this.skipReadyCheck = true;
  }

  private isInServerSelect() {
    return this.bot.flash.get("mcLogin.currentLabel", true) === "Servers";
  }

  public override async execute() {
    if (this.bot.auth.isLoggedIn()) return;

    if (
      !AutoReloginJob.username ||
      !AutoReloginJob.password ||
      !AutoReloginJob.server
    )
      return;

    if (this.mutex.isLocked()) return;

    await this.mutex.runExclusive(async () => {
      const og_lagKiller = this.bot.settings.lagKiller;
      const og_skipCutscenes = this.bot.settings.skipCutscenes;

      if (og_lagKiller) this.bot.settings.lagKiller = false;
      if (og_skipCutscenes) this.bot.settings.skipCutscenes = false;

      if (this.bot.auth.isTemporarilyKicked()) {
        await this.bot.waitUntil(
          () => !this.bot.auth.isTemporarilyKicked(),
          null,
          60,
        );
      }

      logger.info(`Triggered, waiting ${AutoReloginJob.delay}ms...`);
      await this.bot.sleep(AutoReloginJob.delay);

      // Still on server select?
      if (this.isInServerSelect()) {
        this.bot.flash.call("removeAllChildren");
        this.bot.flash.call("gotoAndPlay", "Login");
      }

      await this.bot.sleep(1_000);

      this.bot.auth.login(AutoReloginJob.username!, AutoReloginJob.password!);

      await this.bot.waitUntil(() => this.isInServerSelect(), null, 5);
      if (!this.isInServerSelect()) {
        logger.info("Still not in server select? Aborting...");
        return;
      }

      await this.bot.waitUntil(() => this.bot.auth.servers.length > 0, null, 5);
      if (this.bot.auth.servers.length === 0) {
        logger.info("No servers loaded? Aborting...");
        return;
      }

      this.bot.auth.connectTo(AutoReloginJob.server!);

      await this.bot.waitUntil(() => this.bot.player.isReady(), null, 25);

      // Still stuck in blue flame?
      if (!this.bot.player.isReady()) {
        logger.info("Still not ready? Logging out...");
        this.bot.auth.logout();
        return;
      }

      this.bot.settings.lagKiller = og_lagKiller;
      this.bot.settings.skipCutscenes = og_skipCutscenes;
    });
  }

  /**
   * Sets the credentials for auto-login.
   *
   * @param username - The username to login with.
   * @param password - The password to login with.
   * @param server - The server name to connect to.
   */
  public static setCredentials(
    username: string,
    password: string,
    server?: string,
  ): void {
    if (username) AutoReloginJob.username = username;
    if (password) AutoReloginJob.password = password;
    if (server) AutoReloginJob.server = server;
  }

  public static reset() {
    AutoReloginJob.username = "";
    AutoReloginJob.password = "";
    AutoReloginJob.server = "";
    AutoReloginJob.delay = 5_000;
  }
}
