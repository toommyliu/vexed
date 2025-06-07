export type FastTravel = {
  /**
   * The cell to jump to. Defaults to "Enter".
   */
  cell?: string;
  /**
   * The map name to join.
   */
  map: string;
  /**
   * The display name of the location.
   */
  name: string;
  /**
   * The pad to jump to. Defaults to "Spawn".
   */
  pad?: string;
};

export type FastTravelRoomNumber = FastTravel & {
  roomNumber: number;
};

export enum LoaderDataType {
  HairShop,
  Shop,
  Quest,
  ArmorCustomizer,
}

export enum GrabberDataType {
  Shop,
  Quest,
  Inventory,
  TempInventory,
  Bank,
  CellMonsters,
  MapMonsters,
}
