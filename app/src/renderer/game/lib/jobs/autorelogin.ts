import { Mutex } from "async-mutex";
import { CommandExecutor } from "~/botting/command-executor";
import type { Bot } from "~/lib/Bot";
import { autoReloginState } from "../autoReloginState.svelte";
import { Job } from "./Job";

const MAX_CONSECUTIVE_FAILURES = 5;
const MIN_FAILED_COOLDOWN = 1_000;
const MAX_FAILED_COOLDOWN = 60_000;
const SOFT_FAILURE_COOLDOWN_BASE = 2_000;
const SOFT_FAILURE_COOLDOWN_JITTER = 2_000;
const JITTER_MAX = 3_000;

const TIMEOUT_TEMP_KICK_WAIT = 60_000;
const TIMEOUT_SERVER_SELECT = 10_000;
const TIMEOUT_SERVERS_LOAD = 5_000;
const TIMEOUT_GAME_ENTRY = 15_000;
const TIMEOUT_PLAYER_READY = 10_000;

export class AutoReloginJob extends Job {
  private readonly mutex = new Mutex(); // internal - for login attempt

  private static readonly globalMutex = new Mutex(); // global - for autorelogin job

  // Failure tracking (internal to job, not UI-relevant)
  private static lastFailedAttempt = 0;

  private static lastAttemptTime = 0;

  private static failedCooldown = 10_000;

  private static consecutiveFailures = 0;

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
      autoReloginState.username
    ) {
      return (
        this.bot.auth.username.toLowerCase() !==
        autoReloginState.username.toLowerCase()
      );
    }

    return false;
  }

  private shouldRun(): boolean {
    // Check if autorelogin is enabled and configured
    if (!autoReloginState.enabled || !autoReloginState.isConfigured) {
      return false;
    }

    if (this.bot.player.isReady()) {
      return false;
    }

    const context = CommandExecutor.getInstance();
    if (context.isRunning()) {
      return false;
    }

    if (this.mutex.isLocked()) {
      return false;
    }

    const now = Date.now();
    if (
      now - AutoReloginJob.lastFailedAttempt <
      AutoReloginJob.failedCooldown
    ) {
      return false;
    }

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (now - AutoReloginJob.lastAttemptTime < autoReloginState.delay) {
      return false;
    }

    return true;
  }

  public override execute = async () => {
    if (!this.shouldRun()) return;

    await AutoReloginJob.globalMutex.runExclusive(async () => {
      if (
        !autoReloginState.username ||
        !autoReloginState.password ||
        !autoReloginState.server
      ) {
        return;
      }

      await this.mutex.runExclusive(async () => {
        await this.performLoginAttempt();
      });
    });
  };

  private async performLoginAttempt() {
    const executor = CommandExecutor.getInstance();
    if (executor.isRunning()) {
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
        return;
      }

      AutoReloginJob.lastAttemptTime = Date.now();
      await this.bot.sleep(autoReloginState.delay);

      if (this.checkInterruption(executor)) return;

      try {
        this.bot.auth.login(
          autoReloginState.username!,
          autoReloginState.password!
        );
        initiatedLogin = true;
      } catch {
        AutoReloginJob.markFailure();
        return;
      }

      if (!(await this.waitForServerSelect())) return;

      if (!(await this.loadServers())) return;

      const didClickServer = await this.connectToServer();
      if (!didClickServer) return;

      await this.bot.sleep(1_000);

      if (this.manualLoginDetected()) {
        return;
      }

      if (!(await this.waitForGameEntry(didClickServer, initiatedLogin)))
        return;

      AutoReloginJob.resetFailureState();
    } finally {
      this.bot.settings.lagKiller = og_lagKiller;
      this.bot.settings.skipCutscenes = og_skipCutscenes;
    }
  }

  private checkInterruption(context: any): boolean {
    if (context.isRunning()) {
      return true;
    }

    if (this.bot.auth.isLoggedIn()) {
      return true;
    }

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (this.manualLoginDetected()) {
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
          // Did not reach server select in time
        }
      });

    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (!this.isInServerSelect()) {
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
          // Servers did not load in time
        }
      });

    if (this.bot.auth.servers.length === 0) {
      AutoReloginJob.markFailure();
      return false;
    }

    return true;
  }

  private async connectToServer(): Promise<boolean> {
    let didClickServer: boolean;
    try {
      didClickServer = await Promise.resolve(
        this.bot.auth.connectTo(autoReloginState.server!)
      );
    } catch {
      AutoReloginJob.markFailure();
      return false;
    }

    if (!didClickServer) {
      AutoReloginJob.markFailure();
      return false;
    }

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
          arg.abort();
          return false;
        }

        if (connMcText.toLowerCase().includes("server is full")) {
          arg.abort();
          return false;
        }

        const isBackButtonVisible = this.bot.flash.call<boolean>(() => swf.isConnMcBackButtonVisible());
        if (isBackButtonVisible) {
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
      autoReloginState.username &&
      this.bot.auth.username.toLowerCase() !==
      autoReloginState.username.toLowerCase()
    );

    if (initiatedLogin && this.bot.auth.isLoggedIn() && !manualDifferentUser) {
      try {
        this.bot.auth.logout();
      } catch {
        // Failed to logout after failure
      }
    }

    if (manualDifferentUser) {
      // No failure state update due to manual login by different user
    } else if (reason === "aborted") {
      AutoReloginJob.markSoftFailure();
    } else {
      AutoReloginJob.markFailure();
    }
  }

  /**
   * Resets failure tracking state. Called when credentials are updated.
   */
  public static resetForNewCredentials(): void {
    AutoReloginJob.resetFailureState();
    AutoReloginJob.lastAttemptTime = 0; // allow immediate attempt
  }
}
