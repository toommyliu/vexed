import { Mutex } from "async-mutex";
import log from "electron-log";
import { CommandExecutor } from "@botting/command-executor";
import type { Bot } from "@lib/Bot";
import { Job } from "./Job";

const logger = log.scope("AutoRelogin");
void log;
void logger;

const MAX_CONSECUTIVE_FAILURES = 5;
const MIN_FAILED_COOLDOWN = 1_000;
const MAX_FAILED_COOLDOWN = 60_000;
const DEFAULT_DELAY = 5_000;
const SOFT_FAILURE_COOLDOWN_BASE = 2_000;
const SOFT_FAILURE_COOLDOWN_JITTER = 2_000;
const JITTER_MAX = 3_000;

const TIMEOUT_CREDENTIALS_APPLY = 10_000;
const TIMEOUT_TEMP_KICK_WAIT = 60_000;
const TIMEOUT_SERVER_SELECT = 10_000;
const TIMEOUT_SERVERS_LOAD = 5_000;
const TIMEOUT_GAME_ENTRY = 15_000;
const TIMEOUT_PLAYER_READY = 10_000;

export class AutoReloginJob extends Job {
  private readonly mutex = new Mutex(); // internal - for login attempt

  private static readonly globalMutex = new Mutex(); // global - for autorelogin job

  private static _username: string | null = null;

  private static _password: string | null = null;

  private static _server: string | null = null;

  private static _delay = DEFAULT_DELAY;

  // Failure tracking
  private static lastFailedAttempt = 0;

  private static lastAttemptTime = 0;

  private static failedCooldown = 10_000;

  private static consecutiveFailures = 0;

  private static pendingSetCredentials = false;

  public static get username(): string | null {
    return AutoReloginJob._username;
  }

  public static get password(): string | null {
    return AutoReloginJob._password;
  }

  public static get server(): string | null {
    return AutoReloginJob._server;
  }

  public static get delay(): number {
    return AutoReloginJob._delay;
  }

  public static set delay(value: number) {
    AutoReloginJob._delay = value;
  }

  private static setCooldownForFailure(): void {
    const attempt = Math.min(
      AutoReloginJob.consecutiveFailures,
      MAX_CONSECUTIVE_FAILURES
    );
    const base = Math.min(
      MIN_FAILED_COOLDOWN * 2 ** Math.max(0, attempt - 1),
      MAX_FAILED_COOLDOWN
    ); // exponential backoff
    const jitter = Math.floor(Math.random() * JITTER_MAX);
    AutoReloginJob.failedCooldown = Math.min(
      base + jitter,
      MAX_FAILED_COOLDOWN
    );
  }

  private static markFailure(now = Date.now()): void {
    AutoReloginJob.consecutiveFailures += 1;
    AutoReloginJob.setCooldownForFailure();
    AutoReloginJob.lastFailedAttempt = now;
    AutoReloginJob.lastAttemptTime = now;
    /* log.debug(
      `autorelogin markFailure: failures=${AutoReloginJob.consecutiveFailures}, cooldown=${AutoReloginJob.failedCooldown}ms, lastAttemptTime=${AutoReloginJob.lastAttemptTime}`
    ); */
  }

  private static resetFailureState(): void {
    AutoReloginJob.consecutiveFailures = 0;
    AutoReloginJob.failedCooldown = 10_000;
    AutoReloginJob.lastFailedAttempt = 0;
    AutoReloginJob.lastAttemptTime = 0;
  }

  private static markSoftFailure(now = Date.now()): void {
    // soft failures get a smaller cooldown to avoid immediate retries but won't trigger
    // exponential backoff
    const softCooldown =
      SOFT_FAILURE_COOLDOWN_BASE +
      Math.floor(Math.random() * SOFT_FAILURE_COOLDOWN_JITTER);
    AutoReloginJob.failedCooldown = Math.min(
      softCooldown,
      MAX_FAILED_COOLDOWN
    );
    AutoReloginJob.lastFailedAttempt = now;
    AutoReloginJob.lastAttemptTime = now;
    /* log.debug(
      `autorelogin markSoftFailure: cooldown=${AutoReloginJob.failedCooldown}ms, lastAttemptTime=${AutoReloginJob.lastAttemptTime}`
    ); */
  }

  public constructor(private readonly bot: Bot) {
    super("autorelogin", 10);
    this.skipReadyCheck = true;
  }

  private readonly isInServerSelect = () =>
    this.bot.flash.get("mcLogin.currentLabel", true) === "Servers";

  private manualLoginDetected() {
    if (this.bot.player.isReady()) return true;

    if (
      this.bot.auth.isLoggedIn() &&
      this.bot.auth.username &&
      AutoReloginJob._username
    ) {
      return (
        this.bot.auth.username.toLowerCase() !==
        AutoReloginJob._username.toLowerCase()
      );
    }

    return false;
  }

  private shouldRun(): boolean {
    if (this.bot.player.isReady()) {
      // logger.debug("player ready; no need to autorelogin");
      return false;
    }

    const context = CommandExecutor.getInstance();
    if (context.isRunning()) {
      // logger.debug("commands are running; skipping autorelogin");
      return false;
    }

    if (this.bot.player.isReady()) {
      // logger.debug("player ready; no need to autorelogin");
      return false;
    }

    if (this.mutex.isLocked()) {
      // logger.debug("instance mutex is locked; skipping autorelogin");
      return false;
    }

    const now = Date.now();
    if (
      now - AutoReloginJob.lastFailedAttempt <
      AutoReloginJob.failedCooldown
    ) {
      /* no remaining variable needed; previously used only for logging */
      /* logger.debug(
        `In cooldown from previous failed attempt, ${remaining}s remaining, skipping...`
      );*/
      return false;
    }

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (now - AutoReloginJob.lastAttemptTime < AutoReloginJob.delay) {
      /* no remaining variable needed; previously used only for logging */
      /* logger.debug(
        `Waiting between attempts, ${remaining}s remaining (enforced by delay=${AutoReloginJob.delay}ms)`
      );*/
      return false;
    }

    return true;
  }

  public override execute = async () => {
    if (!this.shouldRun()) return;

    if (AutoReloginJob.pendingSetCredentials) {
      /* logger.debug(
        "setCredentials in-flight; waiting for credentials to be applied"
      );*/
      const pendRes = await this.bot.waitUntil(
        () => !AutoReloginJob.pendingSetCredentials,
        {
          interval: 50,
          timeout: TIMEOUT_CREDENTIALS_APPLY,
        }
      );
      if (pendRes.isErr()) {
        /* logger.warn(
          "Timed out waiting for credentials to be applied; aborting autorelogin attempt"
        );*/
        return;
      }
    }

    await AutoReloginJob.globalMutex.runExclusive(async () => {
      // logger.debug("AutoReloginJob acq globalMutex for this attempt");
      /* logger.debug(
        `credentials: username=${AutoReloginJob._username}, server=${AutoReloginJob._server}`
      );*/

      if (
        !AutoReloginJob._username ||
        !AutoReloginJob._password ||
        !AutoReloginJob._server
      ) {
        // logger.debug("No credentials present, aborting autorelogin");
        return;
      }

      await this.mutex.runExclusive(async () => {
        await this.performLoginAttempt();
      });
      // logger.debug("AutoReloginJob releasing globalMutex after attempt");
    });
  };

  private async performLoginAttempt() {
    const executor = CommandExecutor.getInstance();
    if (executor.isRunning()) {
      // logger.debug("Commands started running, aborting autorelogin");
      return;
    }

    const og_lagKiller = this.bot.settings.lagKiller;
    const og_skipCutscenes = this.bot.settings.skipCutscenes;
    let initiatedLogin = false;

    try {
      this.bot.settings.lagKiller = false;
      this.bot.settings.skipCutscenes = false;

      await this.bot.waitUntil(() => !this.bot.auth.isTemporarilyKicked(), {
        timeout: TIMEOUT_TEMP_KICK_WAIT,
      });

      if (executor.isRunning()) {
        /* logger.debug(
          "Commands started running during temp kick wait, aborting..."
        );*/
        return;
      }

      // logger.debug(`Triggered, waiting ${AutoReloginJob.delay}ms...`);
      AutoReloginJob.lastAttemptTime = Date.now();
      await this.bot.sleep(AutoReloginJob.delay);

      if (this.checkInterruption(executor)) return;

      try {
        this.bot.auth.login(
          AutoReloginJob._username!,
          AutoReloginJob._password!
        );
        initiatedLogin = true;
      } catch {
        // logger.error(`Exception thrown during auth.login: ${error}`);
        AutoReloginJob.markFailure();
        return;
      }

      if (!(await this.waitForServerSelect())) return;

      if (!(await this.loadServers())) return;

      const didClickServer = await this.connectToServer();
      if (!didClickServer) return;

      await this.bot.sleep(1_000);

      if (this.manualLoginDetected()) {
        /* logger.debug(
          "Manual login detected after clicking server, aborting autorelogin"
        );*/
        return;
      }

      if (!(await this.waitForGameEntry(didClickServer, initiatedLogin)))
        return;

      // logger.debug('success');
      AutoReloginJob.resetFailureState();
    } finally {
      this.bot.settings.lagKiller = og_lagKiller;
      this.bot.settings.skipCutscenes = og_skipCutscenes;
    }
  }

  private checkInterruption(context: any): boolean {
    if (context.isRunning()) {
      // logger.debug("Commands started running, aborting...");
      return true;
    }

    if (this.bot.auth.isLoggedIn()) {
      // logger.debug("Login state changed, aborting autorelogin");
      return true;
    }

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (this.manualLoginDetected()) {
      // logger.debug("Manual login detected, aborting autorelogin");
      return true;
    }

    return false;
  }

  private async waitForServerSelect(): Promise<boolean> {
    await this.bot
      .waitUntil(() => this.isInServerSelect(), {
        timeout: TIMEOUT_SERVER_SELECT,
      })
      .then((res) => {
        if (res.isErr()) {
          // logger.debug("Did not reach server select in time");
        }
      });

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (!this.isInServerSelect()) {
      // logger.debug("Still not in server select, aborting...");
      return false;
    }

    return true;
  }

  private async loadServers(): Promise<boolean> {
    await this.bot
      .waitUntil(() => this.bot.auth.servers.length > 0, {
        timeout: TIMEOUT_SERVERS_LOAD,
      })
      .then((res) => {
        if (res.isErr()) {
          // logger.debug("Servers did not load in time");
        }
      });

    if (this.bot.auth.servers.length === 0) {
      // logger.debug("No servers loaded, aborting...");
      AutoReloginJob.markFailure();
      return false;
    }

    return true;
  }

  private async connectToServer(): Promise<boolean> {
    let didClickServer: boolean;
    try {
      didClickServer = await Promise.resolve(
        this.bot.auth.connectTo(AutoReloginJob._server!)
      );
    } catch {
      // logger.debug(`Server connection attempt failed: ${error}`);
      AutoReloginJob.markFailure();
      return false;
    }

    if (!didClickServer) {
      // logger.debug("connectTo returned false, aborting login attempt");
      AutoReloginJob.markFailure();
      return false;
    }

    /* logger.debug(
      `clicked server: ${AutoReloginJob._server!} - ${didClickServer}`
    ); */
    return true;
  }

  private async waitForGameEntry(
    didClickServer: boolean,
    initiatedLogin: boolean
  ): Promise<boolean> {
    const res = await this.bot.waitUntil(
      (arg) => {
        if (
          this.bot.flash.get("currentLabel", true) === "Game" &&
          this.bot.flash.isNull("mcConnDetail.stage")
        )
          return true;

        const connMcText = this.bot.flash.call<string>(() => swf.getConnMcText()) ?? "";
        if (connMcText === "null" && didClickServer) {
          /* logger.debug(
            "currentLabel is=" + this.bot.flash.get("currentLabel", true)
          ); */
          // logger.debug("Null connection message detected, aborting...");
          arg.abort();
          return false;
        }

        if (connMcText.toLowerCase().includes("server is full")) {
          // logger.debug("Server is full message detected, aborting...");
          arg.abort();
          return false;
        }

        const isBackButtonVisible = this.bot.flash.call<boolean>(() => swf.isConnMcBackButtonVisible());
        if (isBackButtonVisible) {
          // logger.debug("Back button visible, aborting login attempt...");
          arg.abort();
          return false;
        }

        return false;
      },
      { interval: 5_000, timeout: TIMEOUT_GAME_ENTRY }
    );

    if (res.isErr()) {
      this.handleLoginFailure(res.error, initiatedLogin);
      return false;
    }

    await this.bot.waitUntil(() => this.bot.player.isReady(), {
      timeout: TIMEOUT_PLAYER_READY,
    });

    if (!this.bot.player.isReady()) {
      // logger.debug("Still not ready after relogin...");
      this.handleLoginFailure("not_ready", initiatedLogin);
      return false;
    }

    return true;
  }

  private handleLoginFailure(
    reason: string,
    initiatedLogin: boolean
  ) {
    const manualDifferentUser = Boolean(
      this.bot.auth.isLoggedIn() &&
      this.bot.auth.username &&
      AutoReloginJob._username &&
      this.bot.auth.username.toLowerCase() !==
      AutoReloginJob._username.toLowerCase()
    );

    /* logger.debug(
      `Login failure: reason=${reason}; manualDifferentUser=${manualDifferentUser}`
    ); */

    if (initiatedLogin && this.bot.auth.isLoggedIn()) {
      if (manualDifferentUser) {
        // logger.debug("Skipping logout because a different user is logged in");
      } else {
        // logger.debug("Logout initiated by autorelogin job after failure");
        try {
          this.bot.auth.logout();
        } catch {
          // logger.warn(`Failed to logout after failure: ${error}`);
        }
      }
    }

    if (manualDifferentUser) {
      /* logger.debug(
        "No failure state update due to manual login by different user"
      ); */
    } else if (reason === "aborted") {
      AutoReloginJob.markSoftFailure();
    } else {
      AutoReloginJob.markFailure();
    }
  }

  /**
   * Sets the credentials for auto-login.
   */
  public static async setCredentials(
    username: string,
    password: string,
    server?: string
  ): Promise<void> {
    await AutoReloginJob.globalMutex.runExclusive(async () => {
      AutoReloginJob.pendingSetCredentials = true;
      try {
        if (username) AutoReloginJob._username = username;
        if (password) AutoReloginJob._password = password;
        if (server) AutoReloginJob._server = server;

        AutoReloginJob.lastAttemptTime = 0; // allow immediate attempt
        AutoReloginJob.resetFailureState();
      } finally {
        AutoReloginJob.pendingSetCredentials = false;
      }
    });

    /* log.debug(
      `AutoReloginJob.setCredentials: username=${AutoReloginJob._username} server=${AutoReloginJob._server}`
    ); */
  }

  public static async reset() {
    /* log.debug(
      "AutoReloginJob.reset requested; waiting for any active autorelogin to finish..."
    ); */
    await AutoReloginJob.globalMutex.runExclusive(async () => {
      AutoReloginJob._username = null;
      AutoReloginJob._password = null;
      AutoReloginJob._server = null;
      AutoReloginJob._delay = DEFAULT_DELAY;
      AutoReloginJob.resetFailureState();
      /* log.info(
        "AutoReloginJob.reset: credentials cleared and failure state reset"
      ); */
    });
  }
}
