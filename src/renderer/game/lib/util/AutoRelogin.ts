import { Mutex } from "async-mutex";
import { interval } from "../../../../shared/interval";
import { Logger } from "../../../../shared/logger";
import { Bot } from "../Bot";

const logger = Logger.get("AutoRelogin");

/**
 * Auto Relogin attempts a login using the provided username and password.
 *
 * If no server is provided, the bot will login and stay at the server select screen.
 *
 * If a server is provided, it will attempt to connect to the provided server.
 */
export class AutoRelogin {
  private readonly bot = Bot.getInstance();

  private readonly mutex = new Mutex();

  /**
   * The username to login with.
   */
  private username: string | null;

  /**
   * The password to login with.
   */
  private password: string | null;

  /**
   * The server name to connect to.
   */
  public server: string | null;

  /**
   * The delay after which a login attempt is made.
   */
  public delay: number;

  public constructor() {
    this.username = null;
    this.password = null;
    this.server = null;
    this.delay = 5_000;
    this.run();
  }

  /**
   * Runs the auto-login process.
   */
  private run(): void {
    void interval(async () => {
      if (this.bot.auth.isLoggedIn()) return;

      if (!this.username || !this.password || !this.server) return;

      if (this.mutex.isLocked()) return;

      await this.mutex.runExclusive(async () => {
        const og_lagKiller = this.bot.settings.lagKiller;
        const og_skipCutscenes = this.bot.settings.skipCutscenes;

        if (og_lagKiller) {
          this.bot.settings.lagKiller = false;
        }

        if (og_skipCutscenes) {
          this.bot.settings.skipCutscenes = false;
        }

        if (this.bot.auth.isTemporarilyKicked()) {
          await this.bot.waitUntil(
            () => !this.bot.auth.isTemporarilyKicked(),
            null,
            -1,
          );
        }

        logger.info(`triggered, waiting ${this.delay}ms`);
        await this.bot.sleep(this.delay);

        // still on server select?
        if (this.bot.flash.get("mcLogin.currentLabel") === '"Servers"') {
          // reset
          this.bot.flash.call("removeAllChildren");
          this.bot.flash.call("gotoAndPlay", "Login");
        }

        await this.bot.sleep(1_000);

        this.bot.auth.login(this.username!, this.password!);

        // Wait for servers to be loaded
        await this.bot.waitUntil(
          () =>
            this.bot.flash.get("mcLogin.currentLabel", true) === "Servers" &&
            this.bot.auth.servers.length > 0,
        );

        const server = this.bot.auth.servers.find(
          (srv) => srv.name.toLowerCase() === this.server!.toLowerCase(),
        );

        // Unknown server provided
        if (!server) return;

        this.bot.auth.connectTo(server.name);

        await this.bot.waitUntil(() => this.bot.player.isReady(), null, 25);

        // E.g. still stuck in blue flame
        if (!this.bot.player.isReady()) {
          console.warn("Player not ready after login, retrying...");
          this.bot.auth.logout();
          return;
        }

        // restore state
        if (og_lagKiller) {
          this.bot.settings.lagKiller = true;
        }

        if (og_skipCutscenes) {
          this.bot.settings.skipCutscenes = true;
        }
      });
    }, 1_000);
  }

  /**
   * Sets the credentials for auto-login.
   *
   * @param username - The username to login with.
   * @param password - The password to login with.
   * @param server - The server name to connect to.
   */
  public setCredentials(
    username: string,
    password: string,
    server?: string,
  ): void {
    this.username = username;
    this.password = password;

    if (server) {
      this.server = server;
    }
  }
}
