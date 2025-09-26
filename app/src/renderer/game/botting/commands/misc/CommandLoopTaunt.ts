import { interval } from "@vexed/utils";
import { Command } from "@botting/command";
import type { Context } from "@botting/context";
import type { Bot } from "@lib/Bot";
import { isMonsterMapId, extractMonsterMapId } from "@utils/isMonMapId";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

const FOCUS = "Focus";
const DELIM = ",";

const log = (...args: any[]) =>
  console.log(`[${new Date().toLocaleTimeString()}]`, ...args);

function getPotionSlot() {
  return JSON.parse(
    swf.getArrayObject("world.actions.active", 5),
  ) as unknown as {
    cd: number;
    id: number;
    sArg1: string;
    sArg2: string;
    ts: number;
  };
}

function isEquipped() {
  const pot = getPotionSlot();
  return pot?.id === id && pot?.sArg1 === sArg1 && pot?.sArg2 === sArg2;
}

function isOnCooldown() {
  const pot = getPotionSlot();
  const now = Date.now();
  return now < pot?.ts + pot?.cd;
}

// Strategy Configuration Input
type StrategyInput = [
  playerIndex: number,
  maxPlayers: number,
  target: string,
  msg?: string,
];

// Base Strategy Interface
interface ITauntStrategy {
  playerIndex: number;
  maxPlayers: number;
  target: string;
  targetMonMapId: number;
  isActive: boolean;

  initialize(bot: Bot, ctx: Context): Promise<boolean>;
  start(): void;
  cleanup(): void;
  doTaunt(): Promise<void>;
  shouldTaunt(count: number): boolean;
  getName(): string;
}

// Abstract Base Strategy
abstract class BaseTauntStrategy implements ITauntStrategy {
  public playerIndex: number;
  public maxPlayers: number;
  public target: string;
  public targetMonMapId: number = -1;
  public isActive: boolean = false;

  protected bot: Bot;
  protected ctx: Context;
  protected focusCount: number = 0;
  protected stopped: boolean = false;
  protected listeners: Array<{ event: string; handler: Function }> = [];

  constructor(playerIndex: number, maxPlayers: number, target: string) {
    this.playerIndex = playerIndex;
    this.maxPlayers = maxPlayers;
    this.target = target;
  }

  public async initialize(bot: Bot, ctx: Context): Promise<boolean> {
    this.bot = bot;
    this.ctx = ctx;

    // Parse target
    if (!this.parseTarget()) {
      log(`[${this.getName()}] Failed to parse target: ${this.target}`);
      return false;
    }

    this.isActive = true;
    this.stopped = false;

    // Set up monster death listener
    const deathHandler = this.onMonsterDeath.bind(this);
    this.bot.on("monsterDeath", deathHandler);
    this.listeners.push({ event: "monsterDeath", handler: deathHandler });

    // Set up context end listener
    this.ctx.once("end", () => {
      this.stopped = true;
      this.cleanup();
    });

    return true;
  }

  private parseTarget(): boolean {
    if (isMonsterMapId(this.target)) {
      const monMapIdStr = extractMonsterMapId(this.target);
      const monMapId = Number.parseInt(monMapIdStr, 10);
      if (!Number.isNaN(monMapId)) {
        this.targetMonMapId = monMapId;
        return true;
      }
    } else {
      const mon = this.bot.world.availableMonsters.find(
        (mon) => mon.name.toLowerCase() === this.target.toLowerCase(),
      );
      if (mon) {
        this.targetMonMapId = mon.monMapId;
        return true;
      }
    }
    return false;
  }

  public abstract start(): void;
  public abstract getName(): string;

  protected onMonsterDeath(monMapId: number): void {
    if (this.targetMonMapId !== monMapId) return;
    log(`[${this.getName()}] Monster died (${this.target}), strategy complete`);
    this.stopped = true;
    this.isActive = false;
  }

  public shouldTaunt(count: number): boolean {
    return count % this.maxPlayers === this.playerIndex - 1;
  }

  public async doTaunt(): Promise<void> {
    if (
      this.ctx.isRunning() &&
      this.bot.player.isReady() &&
      this.bot.player.alive &&
      !this.stopped
    ) {
      this.bot.combat.attack(`id:${this.targetMonMapId}`);
      await this.bot.combat.useSkill(5, true, true);
      log(
        `[${this.getName()}] TAUNT - Player ${this.playerIndex}/${this.maxPlayers} on ${this.target}`,
      );
    }
  }

  public cleanup(): void {
    this.isActive = false;
    for (const { event, handler } of this.listeners) {
      this.bot.off(event, handler);
    }
    this.listeners = [];
  }
}

// Strategy 1: Simple (Focus Detection)
class SimpleStrategy extends BaseTauntStrategy {
  private focusLock: boolean = false;

  public start(): void {
    const handler = this.onPacketFromServer.bind(this);
    this.bot.on("packetFromServer", handler);
    this.listeners.push({ event: "packetFromServer", handler });

    log(
      `[${this.getName()}] Started for ${this.target} - Player ${this.playerIndex}/${this.maxPlayers}`,
    );
  }

  private onPacketFromServer(packet: string): void {
    if (!packet.startsWith("{")) return;

    try {
      const msg = JSON.parse(packet);
      const data = msg?.b?.o;
      const cmd = data?.cmd;

      if (cmd !== "ct") return;

      const auras = data?.a as any[] | undefined;
      if (!Array.isArray(auras) || !auras?.length) return;

      for (const aItem of auras) {
        if (typeof aItem?.tInf === "string" && !aItem?.tInf.startsWith("m:"))
          continue;

        const monMapId = Number(aItem?.tInf?.split(":")[1]);
        if (monMapId !== this.targetMonMapId) {
          continue;
        }

        const auraList = aItem?.auras as any[] | undefined;

        for (const aura of auraList ?? []) {
          if (aura?.nam !== FOCUS) continue;

          if (this.focusLock) {
            log(`[${this.getName()}] Focus detected but locked, skipping`);
            return;
          }

          if (this.stopped) {
            return;
          }

          this.focusLock = true;
          log(
            `[${this.getName()}] FOCUS detected - Count: ${this.focusCount + 1}`,
          );

          setTimeout(async () => {
            this.focusLock = false;
            log(`[${this.getName()}] Focus lock released`);

            if (
              this.bot.player.isReady() &&
              !this.focusLock &&
              this.shouldTaunt(this.focusCount)
            ) {
              log(
                `[${this.getName()}] It's player ${this.playerIndex}'s turn to taunt ${this.target}`,
              );
              await this.doTaunt();
            }
          }, 10_000);

          this.focusCount += 1;
        }
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  public getName(): string {
    return "SIMPLE";
  }
}

// Strategy 2: Message Detection
class MessageStrategy extends BaseTauntStrategy {
  private msg: string;

  constructor(
    playerIndex: number,
    maxPlayers: number,
    target: string,
    msg: string,
  ) {
    super(playerIndex, maxPlayers, target);
    this.msg = msg;
  }

  public start(): void {
    const handler = this.onCtMessage.bind(this);
    this.bot.on("ctMessage", handler);
    this.listeners.push({ event: "ctMessage", handler });

    log(
      `[${this.getName()}] Started for ${this.target} - Player ${this.playerIndex}/${this.maxPlayers}, msg: "${this.msg}"`,
    );
  }

  private async onCtMessage(
    packet: string,
    obj: Record<string, string>,
  ): Promise<void> {
    if (typeof packet !== "string") {
      return;
    }

    if (!packet.toLowerCase().includes(this.msg.toLowerCase())) return;

    if (
      "tInf" in obj &&
      typeof obj?.["tInf"] === "string" &&
      String(obj?.["tInf"].split(":")[1]) !== String(this.targetMonMapId)
    ) {
      return;
    }

    log(`[${this.getName()}] Message detected - Count: ${this.focusCount + 1}`);

    if (this.shouldTaunt(this.focusCount)) {
      log(
        `[${this.getName()}] It's player ${this.playerIndex}'s turn to taunt ${this.target}`,
      );
      await this.doTaunt();
    }

    this.focusCount += 1;
  }

  public getName(): string {
    return `MSG:${this.msg}`;
  }
}

// Main Command Class - Non-blocking background execution
export class CommandLoopTaunt extends Command {
  public strategies!: StrategyInput[];

  private strategyInstances: ITauntStrategy[] = [];
  private currentStrategy: ITauntStrategy | null = null;
  private currentStrategyIndex: number = 0;
  private isRunning: boolean = false;

  public override async execute(): Promise<void> {
    // Create strategy instances from input
    if (!this.createStrategies()) {
      log("Failed to create strategies");
      return;
    }

    // Start background execution without blocking
    this.startBackgroundExecution();

    // Return immediately to not block the command queue
    log("CommandLoopTaunt started in background");
  }

  private createStrategies(): boolean {
    if (!Array.isArray(this.strategies) || this.strategies.length === 0) {
      log("No strategies provided");
      return false;
    }

    for (const strategyInput of this.strategies) {
      if (!Array.isArray(strategyInput) || strategyInput.length < 3) {
        log("Invalid strategy input format");
        continue;
      }

      const [target, playerIndex, maxPlayers, msg] = strategyInput;

      // Validate inputs
      if (typeof playerIndex !== "number" || playerIndex <= 0) {
        log(`Invalid playerIndex: ${playerIndex}`);
        continue;
      }

      if (typeof maxPlayers !== "number" || maxPlayers <= 0) {
        log(`Invalid maxPlayers: ${maxPlayers}`);
        continue;
      }

      if (!target || typeof target !== "string") {
        log(`Invalid target: ${target}`);
        continue;
      }

      // Create appropriate strategy based on whether msg is provided
      let strategy: ITauntStrategy;

      if (msg && typeof msg === "string") {
        // Message strategy
        strategy = new MessageStrategy(playerIndex, maxPlayers, target, msg);
      } else {
        // Simple strategy
        strategy = new SimpleStrategy(playerIndex, maxPlayers, target);
      }

      this.strategyInstances.push(strategy);
    }

    return this.strategyInstances.length > 0;
  }

  private async startBackgroundExecution(): Promise<void> {
    this.isRunning = true;

    // Set up context end listener
    this.ctx.once("end", () => {
      this.isRunning = false;
      if (this.currentStrategy) {
        this.currentStrategy.cleanup();
      }
    });

    // Execute first strategy
    this.executeNextStrategy();
  }

  private async executeNextStrategy(): Promise<void> {
    if (
      !this.isRunning ||
      this.currentStrategyIndex >= this.strategyInstances.length
    ) {
      log("All strategies completed or execution stopped");
      return;
    }

    // Clean up previous strategy if exists
    if (this.currentStrategy) {
      this.currentStrategy.cleanup();
    }

    this.currentStrategy = this.strategyInstances[this.currentStrategyIndex];

    const initialized = await this.currentStrategy?.initialize(
      this.bot,
      this.ctx,
    );
    if (!initialized) {
      log(`Failed to initialize strategy ${this.currentStrategyIndex + 1}`);
      this.currentStrategyIndex++;
      this.executeNextStrategy();
      return;
    }

    log(
      `Starting strategy ${this.currentStrategyIndex + 1}/${this.strategyInstances.length}: ${this.currentStrategy.getName()}`,
    );
    this.currentStrategy.start();

    // Monitor strategy completion in background
    void interval(async (_, stop) => {
      if (!this.isRunning) {
        stop();
        return;
      }

      if (!this.currentStrategy?.isActive) {
        stop();
        this.currentStrategyIndex++;
        // Continue to next strategy
        this.executeNextStrategy();
      }
    }, 1_000);
  }

  public override toString(): string {
    const strategyDescriptions = this.strategies
      .map((s) => {
        const [playerIndex, maxPlayers, target, msg] = s;
        return msg
          ? `MSG(p${playerIndex}/${maxPlayers}, ${target}, "${msg}")`
          : `SIMPLE(p${playerIndex}/${maxPlayers}, ${target})`;
      })
      .join(", ");
    return `Loop taunt - Strategies: [${strategyDescriptions}]`;
  }
}
