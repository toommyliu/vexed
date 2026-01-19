import type { ItemData } from "../types/ItemData";

/**
 * The base class for all-things item related.
 */
export class Item {
  public constructor(
    /**
     * Data about this item
     */
    public data: ItemData,
  ) {}

  /**
   * The ID of the item.
   */
  public get id(): number {
    return this.data.ItemID;
  }

  /**
   * The name of the item.
   */
  public get name(): string {
    return this.data.sName;
  }

  /**
   * The description of the item.
   */
  public get description(): string {
    return this.data.sDesc;
  }

  /**
   * The quantity of the item in this stack.
   */
  public get quantity(): number {
    return this.data.iQty;
  }

  /**
   * The maximum stack size this item can exist in.
   */
  public get maxStack(): number {
    return this.data.iStk;
  }

  /**
   * Whether the item is member-only.
   */
  public isUpgrade(): boolean {
    return this.data.bUpg === 1;
  }

  /**
   * Whether the item is AC tagged.
   */
  public isAC(): boolean {
    if (typeof this.data.bCoins === "number") {
      return this.data.bCoins === 1;
    } else if (typeof this.data.bCoins === "string") {
      return this.data.bCoins === "1";
    }

    return false;
  }

  /**
   * The category of the item.
   */
  public get category(): string {
    return this.data.sType;
  }

  /**
   * Whether the item belongs to the temp inventory.
   */
  public isTemp(): boolean {
    return this.data.bTemp === 1;
  }

  /**
   * The group of the item.
   *
   * @remarks
   * co = Armor
   *
   * ba = Cape
   *
   * he = Helm
   *
   * pe = Pet
   *
   * Weapon = Weapon
   */
  public get itemGroup(): string {
    return this.data.sES;
  }

  /**
   * Whether the item is type Armor.
   */
  public isArmor(): boolean {
    return this.itemGroup === "co";
  }

  /**
   * Whether the item is type Cape.
   */
  public isCape(): boolean {
    return this.itemGroup === "ba";
  }

  /**
   * Whether the item is type Helm.
   */
  public isHelm(): boolean {
    return this.itemGroup === "he";
  }

  /**
   * Whether the item is type Pet.
   */
  public isPet(): boolean {
    return this.itemGroup === "pe";
  }

  /**
   * Whether the item is type Weapon.
   */
  public isWeapon(): boolean {
    return this.itemGroup === "Weapon";
  }

  /**
   * The name of the source file of the item.
   */
  public get fileName(): string {
    return this.data.sLink;
  }

  /**
   * The link to the source file of the item
   */
  public get fileLink(): string {
    return this.data.sFile;
  }

  /**
   * The meta value of the item.
   *
   * @remarks
   *
   * This is specifically for items with boosts.
   */
  public get meta(): Record<string, number> | null {
    if (!this.data.sMeta) return null;

    // TODO:
    // 1. boosted items
    // 2. Gear of Doom

    return this.data.sMeta
      .split(",")
      .reduce<Record<string, number>>((acc, cur) => {
        const [key, value] = cur.split(":") as [string, string];
        acc[key] = Number.parseFloat(value);
        return acc;
      }, {});
  }

  /**
   * Whether the item is at its maximum stack size.
   */
  public isMaxed(): boolean {
    return this.quantity === this.maxStack;
  }

  /**
   * Whether the item is member-only.
   */
  public isMember(): boolean {
    return this.data.bUpg === 1;
  }

  /**
   * The character ID of this item.
   */
  public get charItemId(): number {
    return this.data.CharItemID;
  }

  /**
   * Whether the item is equipped.
   */
  public isEquipped(): boolean {
    return this.data.bEquip === 1;
  }

  /**
   * Whether the item is currently being worn.
   */
  public isWearing(): boolean {
    return this.data.bWear === 1;
  }

  /**
   * The level of the item.
   */
  public get level(): number {
    return this.data.iLvl;
  }

  /**
   * The enhancement level of the item.
   */
  public get enhancementLevel(): number {
    return this.data.EnhLvl;
  }

  /**
   * The enhancement pattern ID of the item.
   *
   * @remarks
   * 1: Adventurer
   *
   * 2: Fighter
   *
   * 3: Thief
   *
   * 4: Armsman
   *
   * 5: Hybrid
   *
   * 6: Wizard
   *
   * 7: Healer
   *
   * 8: Spellbreaker
   *
   * 9: Lucky
   *
   * 10: Forge (?)
   */
  public get enhancementPatternId(): number {
    return this.data.EnhPatternID;
  }

  /**
   * Whether the item is a boost.
   */
  public isBoost(): boolean {
    return this.data.sType === "ServerUse";
  }
}
