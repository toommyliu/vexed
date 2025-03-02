import { Item } from './Item';

/**
 * Represents an item in the inventory.
 */
export class InventoryItem extends Item {
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
  public get enchantmentPatternId(): number {
    return this.data.EnhPatternID;
  }
}
