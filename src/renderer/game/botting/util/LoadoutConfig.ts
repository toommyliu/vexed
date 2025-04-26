import { Config } from "./Config";

type LoadoutKey = keyof Loadout;
export type Loadout = {
  Cape?: string;
  Class?: string;
  Helm?: string;
  Pet?: string;
  Weapon?: string;
};

function isLoadoutKey(key: string): key is LoadoutKey {
  return (
    key === "Cape" ||
    key === "Class" ||
    key === "Helm" ||
    key === "Pet" ||
    key === "Weapon"
  );
}

export class LoadoutConfig extends Config {
  public constructor(name: string) {
    super(`loadouts/${name}`);
  }

  /**
   * Get a player's loadout for a specific item type.
   *
   * @param playerNumber - The player number (1-n)
   * @param itemType - The type of item (Class, Weapon, Helm, Cape, etc.)
   * @param defaultValue - The default value to return if not found
   * @returns The item value for the specified player and item type
   */
  public getPlayerItem(
    playerNumber: number,
    itemType: LoadoutKey,
    defaultValue: string = "",
  ): string {
    const key = `Player${playerNumber}.${itemType}`;
    return this.get(key, defaultValue);
  }

  /**
   * Set a player's loadout for a specific item type.
   *
   * @param playerNumber - The player number (1-n)
   * @param itemType - The type of item (Class, Weapon, Helm, Cape, etc.)
   * @param value - The value to set
   */
  public setPlayerItem(
    playerNumber: number,
    itemType: LoadoutKey,
    value: string,
  ): void {
    const key = `Player${playerNumber}.${itemType}`;
    this.set(key, value);
  }

  /**
   * Get all items for a specific player.
   *
   * @param playerNumber - The player number (1-n)
   * @returns An object with all items for the player
   */
  public getPlayerLoadout(playerNumber: number): Loadout {
    const prefix = `Player${playerNumber}.`;
    const loadout: Loadout = {};

    for (const [key, value] of Object.entries(this.data)) {
      if (key.startsWith(prefix)) {
        const itemType = key.slice(prefix.length);
        if (isLoadoutKey(itemType)) {
          loadout[itemType] = value;
        }
      }
    }

    return loadout;
  }

  /**
   * Set a complete loadout for a player.
   *
   * @param playerNumber - The player number (1-n)
   * @param loadout - An object containing the player's loadout
   * @throws Error if loadout contains invalid item types
   */
  public setPlayerLoadout(playerNumber: number, loadout: Loadout): void {
    for (const [itemType, value] of Object.entries(loadout)) {
      if (!isLoadoutKey(itemType)) {
        // throw new Error(`Invalid loadout item type: ${itemType}`);
        return;
      }

      this.setPlayerItem(playerNumber, itemType, value);
    }
  }
}
