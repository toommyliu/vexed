import { TypedEmitter } from "tiny-typed-emitter";
import { Auth } from "./Auth";
import { Bank } from "./Bank";
import { Combat } from "./Combat";
import { Drops } from "./Drops";
import { House } from "./House";
import { Inventory } from "./Inventory";
import { Packets } from "./Packets";
import { Player } from "./Player";
import { Quests } from "./Quests";
import { Settings } from "./Settings";
import { Shops } from "./Shop";
import { TempInventory } from "./TempInventory";
import { World } from "./World";
import { Army } from "./army/Army";
import type { Monster } from "./models/Monster";
import { AutoRelogin } from "./util/AutoRelogin";
import { Flash } from "./util/Flash";

type Events = {
  /**
   * This event is emitted when the player goes AFK.
   */
  afk(): void;
  /**
   * This event is emitted when the player logs in.
   */
  login(): void;
  /**
   * This event is emitted when the player logs out.
   */
  logout(): void;
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
  packetFromClient(packet: string): void;
  packetFromServer(packet: string): void;
  /**
   * OnExtensionResponse event.
   */
  pext(packet: Record<string, unknown>): void;
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
   * The AutoRelogin API class instance.
   */
  public autoRelogin: InstanceType<typeof AutoRelogin>;

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
    this.autoRelogin = new AutoRelogin();

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
  }

  /**
   * Pauses execution for a specified amount of time.
   *
   * @param ms - The number of milliseconds to wait.
   */
  public async sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const id = window.setTimeout(() => {
        window.clearTimeout(id);
        resolve();
      }, ms);
    });
  }

  /**
   * Waits until the condition is met.
   *
   * @param condition - The condition to wait for until it returns true.
   * @param prerequisite - The prerequisite to be checked before waiting for the condition.
   * @param maxIterations - The maximum number of iterations to wait. -1 to wait indefinitely.
   */
  public async waitUntil(
    condition: () => boolean,
    prerequisite: (() => boolean) | null = null,
    maxIterations: number = 15,
  ): Promise<void> {
    let iterations = 0;

    let prerequisiteResult = prerequisite ? prerequisite() : true;
    let conditionResult = condition();
    let timeoutResult = iterations < maxIterations || maxIterations === -1;

    while (prerequisiteResult && !conditionResult && timeoutResult) {
      await this.sleep(1_000);
      iterations++;

      prerequisiteResult = prerequisite ? prerequisite() : true;
      conditionResult = condition();
      timeoutResult = iterations < maxIterations || maxIterations === -1;
    }

    await this.sleep(250);
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
