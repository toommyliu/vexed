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

export type Account = {
  password: string;
  username: string;
};

export type AccountWithServer = Account & {
  server: string | null;
};

export type Settings = {
  /**
   * Whether debug logging is enabled.
   */
  debug: boolean;
  /**
   * The launch mode of the application.
   */
  launchMode: "game" | "manager";
};

export enum WindowIds {
  FastTravels = "tools-fast-travels",
  Follower = "tools-follower",
  Hotkeys = "tools-hotkeys",

  LoaderGrabber = "tools-loader-grabber",

  PacketLogger = "packets-logger",
  PacketSpammer = "packets-spammer",
}

export type HotkeyConfig = {
  General?: {
    "Toggle Auto Aggro"?: string;
    "Toggle Bank"?: string;
    "Toggle Top Bar"?: string;
  };
  Packets?: {
    "Open Packet Logger"?: string;
    "Open Packet Spammer"?: string;
  };
  Scripts?: {
    "Load Script"?: string;
    "Toggle Command Overlay"?: string;
    "Toggle Dev Tools"?: string;
    "Toggle Script"?: string;
  };
  Tools?: {
    "Open Fast Travels"?: string;
    "Open Follower"?: string;
    "Open Loader Grabber"?: string;
  };
};
