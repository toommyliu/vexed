import { Avatar, type AvatarData } from "@vexed/game";
import type { EquipItemPacket } from "~/game/packet-handlers/json/equip-item";
import { factions } from "~/lib/stores/faction";
import type { Bot } from "../Bot";
import { Bank } from "./Bank";
import { House } from "./House";
import { Inventory } from "./Inventory";
import { TempInventory } from "./TempInventory";

export const BoostTypes = {
  ClassPoints: "classPoints",
  Exp: "exp",
  Gold: "gold",
  Rep: "rep",
} as const;

export type BoostType = (typeof BoostTypes)[keyof typeof BoostTypes];

export class Player extends Avatar {
  #className!: string;

  public readonly bank!: Bank;

  public readonly house!: House;

  public readonly inventory!: Inventory;

  public readonly tempInventory!: TempInventory;

  public constructor(public readonly bot: Bot) {
    super({} as AvatarData); // we don't have data yet

    this.bank = new Bank(bot);
    this.house = new House(bot);
    this.inventory = new Inventory(bot);
    this.tempInventory = new TempInventory(bot);
  }

  private get me() {
    return this.bot.world.players.me;
  }

  public override get data(): AvatarData {
    return this.me?.data ?? ({} as AvatarData);
  }

  /**
   * The player's faction data.
   */
  public get factions() {
    return factions;
  }

  /**
   * The name of the player's equipped class.
   */
  public get className(): string {
    return this.#className;
  }

  /**
   * The player's gold.
   */
  public get gold(): number {
    return this.bot.flash.call(() => swf.playerGetGold());
  }

  /**
   * Whether the player is AFK.
   */
  public isAFK(): boolean {
    return this.bot.world.players.me?.data.afk ?? false;
  }

  /**
   * Whether the player has an active membership.
   */
  public isMember(): boolean {
    return this.bot.flash.call(() => swf.playerIsMember());
  }

  /**
   * The player's current position.
   */
  public get position(): [number, number] {
    const me = this.bot.world.players.me;
    if (!me) return [0, 0];
    return [me.data.tx, me.data.ty];
  }

  /**
   * Walks to a position on the map.
   *
   * @param x - The x coordinate to walk to.
   * @param y - The y coordinate to walk to.
   * @param walkSpeed - The speed to walk at.
   */
  public walkTo(x: number, y: number, walkSpeed?: number): void {
    if (!this.bot.player.alive) return;

    this.bot.flash.call(() =>
      swf.playerWalkTo(Number(x), Number(y), Number(walkSpeed)),
    );

    const roomId = this.bot.world.roomId;
    this.bot.packets.sendServer(`%xt%zm%mv%${roomId}%${x}%${y}%${walkSpeed}%`);
  }

  /**
   * Whether the player has fully loaded in.
   */
  public isLoaded(): boolean {
    return Boolean(this.bot.flash.call<boolean>(() => swf.playerIsLoaded()));
  }

  /**
   * Comprehensive check to determine if the player is ready.
   *
   * @remarks
   * This checks if the player is logged in, the world has loaded, and the player has fully loaded in.
   */
  public isReady(): boolean {
    return (
      this.bot.auth.isLoggedIn() &&
      !this.bot.world.isLoading() &&
      this.isLoaded()
    );
  }

  /**
   * Checks if the player has an active boost.
   *
   * @param type - The type of boost to check.
   * @returns Whether the boost is active.
   */
  public isBoostActive(type: BoostType): boolean {
    switch (type) {
      case BoostTypes.Gold:
        return this.bot.flash.get("world.myAvatar.objData.iBoostG", true) > 0;
      case BoostTypes.Exp:
        return this.bot.flash.get("world.myAvatar.objData.iBoostXP", true) > 0;
      case BoostTypes.Rep:
        return this.bot.flash.get("world.myAvatar.objData.iBoostRep", true) > 0;
      case BoostTypes.ClassPoints:
        return this.bot.flash.get("world.myAvatar.objData.iBoostCP", true) > 0;
      default:
        return false;
    }
  }

  public _moveToCell(cell: string, pad: string) {
    if (!this.me) return;
    this.data.strFrame = cell;
    this.data.strPad = pad;
  }

  public _mv(xPos: number, yPos: number) {
    if (!this.me) return;
    this.data.tx = xPos;
    this.data.ty = yPos;
  }

  public _equipItem(packet: EquipItemPacket) {
    const item = this.inventory.get(packet.ItemID);
    if (!item) return;

    // unequip the previously equipped item if it exists
    const previousItem = this.inventory.items
      .all()
      .find((val) => val.data.bEquip === 1 && val.data.sES === packet.strES);
    if (previousItem) {
      console.log(`equipItem :: unequipping ${previousItem.name}`);
      previousItem.data.bEquip = 0;
    }

    // flag the item as equipped
    console.log(`equipItem :: ${item.name}`);
    item.data.bEquip = 1;

    // equip class?
    if (packet?.strES === "ar") {
      this.#className = item.name.toUpperCase(); // backward compatibility
    }
  }
}
