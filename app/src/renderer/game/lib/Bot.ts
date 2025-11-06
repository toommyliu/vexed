import { sleep } from "@vexed/utils";
import { errAsync, okAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import { Army } from "./Army";
import { Auth } from "./Auth";
import { Bank } from "./Bank";
import { Combat } from "./Combat";
import { Drops } from "./Drops";
import { Environment } from "./Environment";
import { House } from "./House";
import { Inventory } from "./Inventory";
import { Packets } from "./Packets";
import { Player } from "./Player";
import { Quests } from "./Quests";
import { Scheduler } from "./Scheduler";
import { Settings } from "./Settings";
import { Shops } from "./Shops";
import { TempInventory } from "./TempInventory";
import { World } from "./World";
import { AutoReloginJob } from "./jobs/autorelogin";
import { BoostsJob } from "./jobs/boosts";
import { DropsJob } from "./jobs/drops";
import { QuestsJob } from "./jobs/quests";
import type { Aura } from "./models/BaseEntity";
import type { Monster } from "./models/Monster";
import { Flash } from "./util/Flash";

type Events = {
  /**
   * This event is emitted when the player goes AFK.
   */
  afk(): void;
  auraAdd(monster: Monster, aura: Aura): void;
  auraRemove(monster: Monster, auraName: string): void;
  ctMessage(
    message: string,
    packet: {
      animStr: string;
      cInf: string;
      fx: string;
      msg: string;
      strFrame: string;
      tInf: string;
    },
  ): void;
  /**
   * This event is emitted when the player logs in.
   */
  login(): void;
  /**
   * This event is emitted when the player logs out.
   */
  logout(): void;
  /**
   * This event is emitted when the map has changed.
   *
   * @param mapName - The name of the new map.
   */
  mapChanged(mapName: string): void;
  /**
   * This event is emitted when a monster has died.
   *
   * @param monMapId - The monster map id.
   */
  monsterDeath(monMapId: number): void;
  /**
   * This event is emitted when a monster has respawned.
   *
   * @param monster - The monster that has respawned.
   */
  monsterRespawn(monster: Monster): void;
  /**
   * @param packet - The packet dispatched from the client.
   */
  packetFromClient(packet: string): void;
  /**
   * @param packet - The packet received from the server.
   */
  packetFromServer(packet: string): void;
  /**
   * OnExtensionResponse event.
   */
  pext(packet: Record<string, unknown>): void;
  /**
   * This event is emitted when a player dies.
   *
   * @param playerName - The name of the player who died.
   */
  playerDeath(playerName: string): void;
  /**
   * This event is emitted when a player joins the room.
   *
   * @param playerName - The name of the player.
   */
  playerJoin(playerName: string): void;
  /**
   * This event is emitted when a player leaves the room.
   *
   * @param playerName - The name of the player.
   */
  playerLeave(playerName: string): void;
};

export class Bot extends TypedEmitter<Events> {
  /**
   * The singleton instance of the Bot class.
   */
  public static _instance: Bot | null = null;

  /**
   * The army API class instance.
   */
  public army: InstanceType<typeof Army>;

  /**
   * The Auth API class instance.
   */
  public auth: InstanceType<typeof Auth>;

  /**
   * The Bank API class instance.
   */
  public bank: InstanceType<typeof Bank>;

  /**
   * The Combat API class instance.
   */
  public combat: InstanceType<typeof Combat>;

  /**
   * The Drops API class instance.
   */
  public drops: InstanceType<typeof Drops>;

  /**
   * The Environment API class instance.
   */
  public environment: InstanceType<typeof Environment>;

  /**
   * The House API class instance.
   */
  public house: InstanceType<typeof House>;

  /**
   * The Inventory API class instance.
   */
  public inventory: InstanceType<typeof Inventory>;

  /**
   * The local Player API class instance.
   */
  public player: InstanceType<typeof Player>;

  /**
   * The Packets API class instance.
   */
  public packets: InstanceType<typeof Packets>;

  /**
   * The Quests API class instance.
   */
  public quests: InstanceType<typeof Quests>;

  /**
   * The Scheduler API class instance.
   */
  public scheduler: InstanceType<typeof Scheduler>;

  /**
   * The Settings API class instance.
   */
  public settings: InstanceType<typeof Settings>;

  /**
   * The Shops API class instance.
   */
  public shops: InstanceType<typeof Shops>;

  /**
   * The TempInventory API class instance.
   */
  public tempInventory: InstanceType<typeof TempInventory>;

  /**
   * The World API class instance.
   */
  public world: InstanceType<typeof World>;

  /**
   * The Flash API class instance.
   */
  public flash: InstanceType<typeof Flash>;

  public constructor() {
    super();

    if (Bot._instance) {
      throw new Error("Bot is a singleton, use Bot.getInstance()");
    }

    Bot._instance = this;

    this.flash = new Flash();

    this.army = new Army(this);
    this.auth = new Auth(this);
    this.bank = new Bank(this);
    this.combat = new Combat(this);
    this.drops = new Drops(this);
    this.house = new House(this);
    this.inventory = new Inventory(this);
    this.player = new Player(this);
    this.packets = new Packets(this);
    this.quests = new Quests(this);
    this.settings = new Settings(this);
    this.shops = new Shops(this);
    this.tempInventory = new TempInventory(this);
    this.world = new World(this);

    this.environment = new Environment(this);
    this.scheduler = new Scheduler(this);

    this.scheduler.addJob(new QuestsJob(this));
    this.scheduler.addJob(new DropsJob(this));
    this.scheduler.addJob(new BoostsJob(this));
    this.scheduler.addJob(new AutoReloginJob(this));

    this.on("logout", () => {
      console.log("clearing player UIDs on logout");
      this.world.playerUids.clear();
    });
  }

  /**
   * Pauses execution for a specified amount of time.
   *
   * @param ms - The number of milliseconds to wait.
   * @param signal - An optional AbortSignal to abort the sleep.
   */
  public async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    await sleep(ms, signal);
  }

  /**
   * Pauses execution until a specified condition is met or a maximum number of iterations is reached.
   *
   * @param condition - A function that returns a boolean indicating whether the condition is met.
   * It receives an object with an AbortSignal and an abort function.
   * @param options - Optional settings for the waitUntil function.
   */
  public async waitUntil(
    condition: ({
      signal,
      abort,
    }: {
      abort(): void;
      signal: AbortSignal;
    }) => boolean,
    options: WaitUntilOptions | null = {},
  ) {
    const opts = options ?? {};
    opts.interval ??= 1_000;
    opts.timeout ??= 3_000;

    const interval = opts.interval;
    const timeout = opts.timeout;

    let ac = null;

    if (!opts.signal) {
      ac = new AbortController();
      opts.signal = ac.signal;
    }

    const abort = () => ac?.abort();
    const args = { signal: opts.signal, abort };

    let iterations = 0;
    let aborted = false;

    const abortListener = () => (aborted = true);
    opts.signal?.addEventListener("abort", abortListener, { once: true });

    try {
      while (true) {
        const loopStartTime = performance.now();

        if (aborted) return await errAsync("aborted");

        if (loopStartTime >= endTime) return await errAsync("timeout");

          if (
            typeof opts.postDelay === "number" &&
            Number.isFinite(opts.postDelay) &&
            opts.postDelay > 0
          )
            await this.sleep(opts.postDelay);

          return await okAsync(void 0);
        }

        if (aborted) return await errAsync("aborted");

        const workDuration = performance.now() - loopStartTime;
        const timeUntilTimeout = endTime - performance.now();

        if (timeUntilTimeout <= 0) return await errAsync("timeout");

        // the time to sleep, restricted by interval and time until timeout
        // e.g. if the time until timeout is less than the interval, only sleep the remaining time
        const sleepDuration = Math.min(
          interval - workDuration,
          timeUntilTimeout,
        );

        if (sleepDuration > 0) await this.sleep(sleepDuration, opts.signal);

        if (aborted) return await errAsync("aborted");
      }
    } finally {
      opts.signal?.removeEventListener("abort", abortListener);
    }
  }

  /**
   * Gets the singleton instance of the Bot class.
   */
  public static getInstance(): Bot {
    Bot._instance ??= new Bot();
    return Bot._instance;
  }
}

// @ts-expect-error debugging
window.Bot = Bot;

type WaitUntilOptions = {
  indefinite?: boolean;
  interval?: number;
  postDelay?: number;
  signal?: AbortSignal;
  timeout?: number;
};
