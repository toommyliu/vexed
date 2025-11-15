import { Mutex } from "async-mutex";
import log from "electron-log";
import { CommandExecutor } from "@botting/command-executor";
import type { Bot } from "@lib/Bot";
import { Job } from "./Job";

let _username: string | null = null;
let _password: string | null = null;
let _server: string | null = null;

let delay = 5_000;
let lastFailedAttempt = 0;
let lastAttemptTime = 0;
let failedCooldown = 10_000;
let consecutiveFailures = 0;
let pendingSetCredentials = false;

const MAX_CONSECUTIVE_FAILURES = 5;
const MIN_FAILED_COOLDOWN = 1_000;
const MAX_FAILED_COOLDOWN = 60_000;

export class AutoReloginJob extends Job {
  private readonly mutex = new Mutex();
  
  private static readonly globalMutex = new Mutex();

  public static get username(): string | null {
    return _username;
  }

  public static get password(): string | null {
    return _password;
  }

  public static get server(): string | null {
    return _server;
  }
  
  public static get delay(): number {
    return delay;
  }

  public static set delay(value: number) {
    delay = value;
  }

  private static setCooldownForFailure(): void {
    const attempt = Math.min(consecutiveFailures, MAX_CONSECUTIVE_FAILURES);
    const base = Math.min(
      MIN_FAILED_COOLDOWN * 2 ** Math.max(0, attempt - 1),
      MAX_FAILED_COOLDOWN,
    ); // exponential backoff
    const jitter = Math.floor(Math.random() * 3_000); // up to 3s of jitter
    failedCooldown = Math.min(base + jitter, MAX_FAILED_COOLDOWN);
  }

  private static markFailure(now = Date.now()): void {
    consecutiveFailures += 1;
    AutoReloginJob.setCooldownForFailure();
    lastFailedAttempt = now;
    lastAttemptTime = now;
    log.debug(
      `autorelogin markFailure: failures=${consecutiveFailures}, cooldown=${failedCooldown}ms, lastAttemptTime=${lastAttemptTime}`,
    );
  }

  private static resetFailureState(): void {
    consecutiveFailures = 0;
    failedCooldown = 10_000;
    lastFailedAttempt = 0;
    lastAttemptTime = 0;
  }

  private static markSoftFailure(now = Date.now()): void {
    // soft failures get a smaller cooldown to avoid immediate retries but won't trigger
    // exponential backoff
    const softCooldown = 2_000 + Math.floor(Math.random() * 2_000); // 2-4s
    failedCooldown = Math.min(softCooldown, MAX_FAILED_COOLDOWN);
    lastFailedAttempt = now;
    lastAttemptTime = now;
    log.debug(
      `autorelogin markSoftFailure: cooldown=${failedCooldown}ms, lastAttemptTime=${lastAttemptTime}`,
    );
  }

  public constructor(private readonly bot: Bot) {
    super("autorelogin", 10);

    this.skipReadyCheck = true;
  }

  private readonly isInServerSelect = () =>
    this.bot.flash.get("mcLogin.currentLabel", true) === "Servers";

  private manualLoginDetected() {
    if (this.bot.player.isReady()) return true;
    if (this.bot.auth.isLoggedIn() && this.bot.auth.username && _username) {
      return this.bot.auth.username.toLowerCase() !== _username.toLowerCase();
    }

    return false;
  }

  public override execute = async () => {
    const logger = log.scope(`autorelogin:${Date.now()}`);
    // create unique scope per execution to avoid log overlap
    // and trace confusion

    if (this.bot.player.isReady()) {
      logger.debug("player ready; no need to autorelogin");
      return;
    }

    const context = CommandExecutor.getInstance();
    if (context.isRunning()) {
      logger.debug("Commands are running; skipping autorelogin");
      return;
    }

    if (this.bot.auth.isLoggedIn() && this.bot.player.isLoaded()) {
      logger.debug("Already logged in and loaded, skipping autorelogin");
      return;
    }

    if (this.mutex.isLocked()) return;

    const now = Date.now();
    if (now - lastFailedAttempt < failedCooldown) {
      const remaining = Math.ceil(
        (failedCooldown - (now - lastFailedAttempt)) / 1_000,
      );
      logger.debug(
        `In cooldown from previous failed attempt, ${remaining}s remaining, skipping... (now=${now}, lastFailedAttempt=${lastFailedAttempt}, failedCooldown=${failedCooldown})`,
      );
      return;
    }

    if (now - lastAttemptTime < delay) {
      const remaining = Math.ceil((delay - (now - lastAttemptTime)) / 1_000);
      logger.debug(
        `Waiting between attempts, ${remaining}s remaining (enforced by delay=${delay}ms) (now=${now}, lastAttemptTime=${lastAttemptTime})`,
      );
      return;
    }

    if (pendingSetCredentials) {
      logger.debug("setCredentials in-flight; waiting for credentials to be applied");
      await this.bot.waitUntil(() => !pendingSetCredentials, {
        interval: 50,
        timeout: 10_000,
      });
    }

    await AutoReloginJob.globalMutex.runExclusive(async () => {
      logger.debug("AutoReloginJob acq globalMutex for this attempt");
      logger.debug(`credentials: username=${_username}, server=${_server}`);
      if (!_username || !_password || !_server) {
        logger.debug("No credentials present, aborting autorelogin");
        return;
      }

      await this.mutex.runExclusive(async () => {

      if (context.isRunning()) {
        logger.debug("Commands started running, aborting autorelogin");
        return;
      }

      const og_lagKiller = this.bot.settings.lagKiller;
      const og_skipCutscenes = this.bot.settings.skipCutscenes;

      let initiatedLogin = false;

      try {
        this.bot.settings.lagKiller = false;
        this.bot.settings.skipCutscenes = false;

        await this.bot.waitUntil(() => !this.bot.auth.isTemporarilyKicked(), {
          timeout: 60_000,
        });

        if (context.isRunning()) {
          logger.debug(
            "Commands started running during temp kick wait, aborting...",
          );
          return;
        }

        logger.debug(`Triggered, waiting ${delay}ms...`);

        lastAttemptTime = Date.now();
        await this.bot.sleep(delay);

        if (context.isRunning()) {
          logger.debug("Commands started running during delay, aborting...");
          return;
        }

        if (this.bot.auth.isLoggedIn()) {
          logger.debug(
            "Login state changed during delay, aborting autorelogin",
          );
          return;
        }

        if (this.manualLoginDetected()) {
          logger.debug(
            "Manual login detected during delay, aborting autorelogin",
          );
          return;
        }

        this.bot.auth.login(_username!, _password!);
        initiatedLogin = true;

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
          AutoReloginJob.markFailure();
          logger.debug(
            `autorelogin failed (#${consecutiveFailures}); cooldown ${failedCooldown}ms`,
          );
          return;
        }

        let didClickServer: boolean;
        try {
          didClickServer = this.bot.auth.connectTo(_server!);
        } catch (error) {
          logger.debug(`Server connection attempt failed: ${error}`);
          AutoReloginJob.markFailure();
          logger.debug(
            `autorelogin failed (#${consecutiveFailures}); cooldown ${failedCooldown}ms`,
          );
          return;
        }

        await this.bot.sleep(1_000);

        if (this.manualLoginDetected()) {
          logger.debug(
            "Manual login detected after clicking server, aborting autorelogin",
          );
          return;
        }

        if (!didClickServer) {
          logger.debug("connectTo returned false, aborting login attempt");
          AutoReloginJob.markFailure();
          logger.debug(
            `autorelogin failed (#${consecutiveFailures}); cooldown ${failedCooldown}ms`,
          );
          return;
        }

        logger.debug(`clicked server: ${_server!} - ${didClickServer}`);

        const res = await this.bot.waitUntil(
          (arg) => {
            if (
              this.bot.flash.get("currentLabel", true) === "Game" &&
              this.bot.flash.isNull("mcConnDetail.stage")
            )
              return true;

            const connMcText = swf.getConnMcText() ?? "";
            if (connMcText === "null" && didClickServer) {
              logger.debug(
                "currentLabel is=" + this.bot.flash.get("currentLabel", true),
              );
              logger.debug("Null connection message detected, aborting...");
              arg.abort();
              return false;
            }

            if (connMcText.toLowerCase().includes("server is full")) {
              logger.debug("Server is full message detected, aborting...");
              arg.abort();
              return false;
            }

            const isBackButtonVisible = swf.isConnMcBackButtonVisible();
            if (isBackButtonVisible) {
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
          const manualDifferentUser = Boolean(
            this.bot.auth.isLoggedIn() &&
              this.bot.auth.username &&
              _username &&
              this.bot.auth.username.toLowerCase() !== _username.toLowerCase(),
          );
          if (res.error === "aborted") {
            logger.debug("Aborted while waiting for login...");
            if (initiatedLogin && this.bot.auth.isLoggedIn()) {
              if (manualDifferentUser) {
                logger.debug(
                  "Skipping logout because a different user is logged in",
                );
              } else {
                logger.debug("Logout initiated by autorelogin job after abort");
                this.bot.auth.logout();
              }
            }

            if (manualDifferentUser) {
              logger.debug(
                "No failure state update due to manual login by different user",
              );
            } else {
              AutoReloginJob.markSoftFailure();
              logger.debug(
                `autorelogin soft failure; cooldown ${failedCooldown}ms`,
              );
            }
          } else if (res.error === "timeout") {
            logger.debug("Timed out while waiting for login...");
            if (initiatedLogin && this.bot.auth.isLoggedIn()) {
              if (manualDifferentUser) {
                logger.debug(
                  "Skipping logout because a different user is logged in",
                );
              } else {
                logger.debug(
                  "Logout initiated by autorelogin job after timeout",
                );
                this.bot.auth.logout();
              }
            }

            if (manualDifferentUser) {
              logger.debug(
                "No failure state update due to manual login by different user",
              );
            } else {
              AutoReloginJob.markFailure();
              logger.debug(
                `autorelogin failed (#${consecutiveFailures}); cooldown ${failedCooldown}ms`,
              );
            }
          }

          return;
        }

        await this.bot.waitUntil(() => this.bot.player.isReady(), {
          timeout: 10_000,
        });

        if (!this.bot.player.isReady()) {
          logger.debug("Still not ready after relogin...");
          const manualDifferentUserNR = Boolean(
            this.bot.auth.isLoggedIn() &&
              this.bot.auth.username &&
              _username &&
              this.bot.auth.username.toLowerCase() !== _username.toLowerCase(),
          );
          if (initiatedLogin) {
            if (manualDifferentUserNR) {
              logger.debug(
                "Skipping logout because a different user is logged in",
              );
            } else {
              logger.debug(
                "Logout initiated by autorelogin job after not-ready state",
              );
              this.bot.auth.logout();
            }
          }

          if (manualDifferentUserNR) {
            logger.debug(
              "No failure state update due to manual login by different user",
            );
          } else {
            AutoReloginJob.markFailure();
            logger.debug(
              `autorelogin failed (#${consecutiveFailures}); cooldown ${failedCooldown}ms`,
            );
          }
        }

        logger.debug(`success!`);
        AutoReloginJob.resetFailureState();
      } finally {
        this.bot.settings.lagKiller = og_lagKiller;
        this.bot.settings.skipCutscenes = og_skipCutscenes;
      }
      });
      logger.debug("AutoReloginJob releasing globalMutex after attempt");
    });
  };

  /**
   * Sets the credentials for auto-login.
   *
   * @param username - The username to login with.
   * @param password - The password to login with.
   * @param server - The server name to connect to.
   */
  public static async setCredentials(
    username: string,
    password: string,
    server?: string,
  ): Promise<void> {
    // Use a pending flag so execute() will defer while credentials are being set
    pendingSetCredentials = true;
    await AutoReloginJob.globalMutex.runExclusive(async () => {
      if (username) _username = username;
      if (password) _password = password;
      if (server) _server = server;

      lastAttemptTime = 0; // allow immediate attempt
      AutoReloginJob.resetFailureState();
    });
    pendingSetCredentials = false;
    log.debug(`AutoReloginJob.setCredentials: username=${_username} server=${_server}`);
  }

  public static async reset() {
    log.debug("AutoReloginJob.reset requested; waiting for any active autorelogin to finish...");
    await AutoReloginJob.globalMutex.runExclusive(async () => {
      _username = null;
      _password = null;
      _server = null;
      delay = 5_000;
      AutoReloginJob.resetFailureState();
      log.info("AutoReloginJob.reset: credentials cleared and failure state reset");
    });
  }
}
