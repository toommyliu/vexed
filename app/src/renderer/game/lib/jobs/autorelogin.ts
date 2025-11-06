import { Mutex } from "async-mutex";
import log from "electron-log";
import { CommandExecutor } from "@/renderer/game/botting/command-executor";
import type { Bot } from "@lib/Bot";
import { Job } from "./Job";

// const logger = log.scope("game/AutoRelogin");

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

  /**
   * Timestamp of the last failed login attempt to prevent rapid retries.
   */
  public static lastFailedAttempt: number = 0;

  /**
   * Cooldown period after a failed attempt before allowing another try.
   */
  public static failedCooldown: number = 10_000;

  /**
   * Sets a random cooldown between 1-10 seconds after a failure.
   */
  private static setRandomCooldown(): void {
    AutoReloginJob.failedCooldown = Math.floor(Math.random() * 9_000) + 1_000; // 1000 to 10000 ms
  }

  public constructor(private readonly bot: Bot) {
    super("autorelogin", 10);

    this.skipReadyCheck = true;
  }

  private readonly isInServerSelect = () =>
    this.bot.flash.get("mcLogin.currentLabel", true) === "Servers";

  public override execute = async () => {
    const logger = log.scope(`autorelogin:${Date.now()}`);
    // create unique scope per execution to avoid log overlap
    // and trace confusion

    if (this.bot.player.isReady()) return;

    const context = CommandExecutor.getInstance();
    if (context.isRunning()) return;

    if (this.bot.auth.isLoggedIn() && this.bot.player.isLoaded()) {
      logger.debug("Already logged in and loaded, skipping autorelogin");
      return;
    }

    if (
      !AutoReloginJob.username ||
      !AutoReloginJob.password ||
      !AutoReloginJob.server
    )
      return;

    if (this.mutex.isLocked()) return;

    const now = Date.now();
    if (
      now - AutoReloginJob.lastFailedAttempt <
      AutoReloginJob.failedCooldown
    ) {
      const remaining = Math.ceil(
        (AutoReloginJob.failedCooldown -
          (now - AutoReloginJob.lastFailedAttempt)) /
          1_000,
      );
      logger.debug(
        `In cooldown from previous failed attempt, ${remaining}s remaining, skipping...`,
      );
      return;
    }

    await this.mutex.runExclusive(async () => {
      if (context.isRunning()) {
        logger.debug("Commands started running, aborting autorelogin");
        return;
      }

      const og_lagKiller = this.bot.settings.lagKiller;
      const og_skipCutscenes = this.bot.settings.skipCutscenes;

      try {
        if (og_lagKiller) this.bot.settings.lagKiller = false;
        if (og_skipCutscenes) this.bot.settings.skipCutscenes = false;

        if (this.bot.auth.isTemporarilyKicked()) {
          await this.bot.waitUntil(() => !this.bot.auth.isTemporarilyKicked(), {
            timeout: 60_000,
          });
        }

        if (context.isRunning()) {
          logger.debug(
            "Commands started running during temp kick wait, aborting...",
          );
          return;
        }

        logger.debug(`Triggered, waiting ${AutoReloginJob.delay}ms...`);
        await this.bot.sleep(AutoReloginJob.delay);

        if (context.isRunning()) {
          logger.debug("Commands started running during delay, aborting...");
          return;
        }

        await this.bot.sleep(Math.floor(Math.random() * 9_000) + 1_000);
        this.bot.auth.login(AutoReloginJob.username!, AutoReloginJob.password!);

        await this.bot
          .waitUntil(() => this.isInServerSelect(), {
            timeout: 10_000,
          })
          .then((res) => {
            if (res.isErr()) {
              logger.debug("Did not reach server select in time");
            }
          });

        if (!this.isInServerSelect()) {
          logger.debug("Still not in server select, aborting...");
          return;
        }

        await this.bot
          .waitUntil(() => this.bot.auth.servers.length > 0, {
            timeout: 5_000,
          })
          .then((res) => {
            if (res.isErr()) {
              logger.debug("Servers did not load in time");
            }
          });
        if (this.bot.auth.servers.length === 0) {
          logger.debug("No servers loaded, aborting...");
          AutoReloginJob.setRandomCooldown();
          AutoReloginJob.lastFailedAttempt = Date.now();
          return;
        }

        let didClickServer: boolean;
        try {
          didClickServer = this.bot.auth.connectTo(AutoReloginJob.server!);
        } catch (error) {
          logger.debug(`Server connection attempt failed: ${error}`);
          AutoReloginJob.setRandomCooldown();
          AutoReloginJob.lastFailedAttempt = Date.now();
          return;
        }

        await this.bot.sleep(1_000);

        logger.debug(
          `clicked server: ${AutoReloginJob.server} - ${didClickServer}`,
        );

        const res = await this.bot.waitUntil(
          (arg) => {
            if (
              this.bot.flash.get("currentLabel", true) === "Game" &&
              this.bot.flash.isNull("mcConnDetail.stage")
            )
              return true;

            if (swf.getConnMcText() === "null" && didClickServer) {
              logger.debug("currentLabel is=" + this.bot.flash.get("currentLabel", true));
              logger.debug("Null connection message detected, aborting...");
              arg.abort();
              return false;
            }

            if (swf.getConnMcText().toLowerCase().includes("server is full")) {
              logger.debug("Server is full message detected, aborting...");
              arg.abort();
              return false;
            }

            if (swf.isConnMcBackButtonVisible()) {
              logger.debug("Back button visible, aborting login attempt...");
              arg.abort();
              return false;
            }

            return false;
          },
          { interval: 5_000, timeout: 15_000 /* allow a little extra time */ },
        );

        // back button should be visible after 10s - this is what the game does
        // so we'll do the same...
        if (res.isErr()) {
          if (res.error === "aborted") {
            logger.debug("Aborted while waiting for login, logging out...");
            this.bot.auth.logout();
            // don't set cooldown for aborted, as it's specific error like server full
          } else if (res.error === "timeout") {
            logger.debug("Timed out while waiting for login, logging out...");
            this.bot.auth.logout();
            AutoReloginJob.setRandomCooldown();
            AutoReloginJob.lastFailedAttempt = Date.now();
          }

          return;
        }

        await this.bot.waitUntil(() => this.bot.player.isReady(), {
          timeout: 10_000,
        });

        if (!this.bot.player.isReady()) {
          logger.debug("Still not ready after relogin, logging out...");
          this.bot.auth.logout();
          AutoReloginJob.lastFailedAttempt = Date.now();
        }

        logger.debug(`success!`);
        AutoReloginJob.lastFailedAttempt = 0;
      } finally {
        this.bot.settings.lagKiller = og_lagKiller;
        this.bot.settings.skipCutscenes = og_skipCutscenes;
      }
    });
  };

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
