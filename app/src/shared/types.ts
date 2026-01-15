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

export type AccountWithScript = AccountWithServer & {
  scriptPath: string | null;
};

export type Settings = {
  checkForUpdates: boolean;
  /**
   * Whether debug logging is enabled (currently unused).
   */
  debug: boolean;
  /**
   * The fallback server for autorelogin. Empty string means auto-select.
   */
  fallbackServer: string;
  /**
   * The launch mode of the application.
   */
  launchMode: "game" | "manager";
  /**
   * The theme of the application.
   */
  theme: "dark" | "light" | "system";
};

export type QuestEntry = {
  /**
   * Optional item ID for quests with multiple rewards.
   * If specified, this item will be selected when completing the quest.
   */
  itemId?: number;
  questId: number;
};

export type EnvironmentState = {
  autoRegisterRequirements: boolean;
  autoRegisterRewards: boolean;
  boosts: string[];
  itemNames: string[];
  questIds: number[];
  /**
   * Mapping of quest ID to selected item ID for reward selection.
   */
  questItemIds: Record<number, number>;
  rejectElse: boolean;
};

export type EnvironmentUpdatePayload = {
  autoRegisterRequirements?: boolean;
  autoRegisterRewards?: boolean;
  boosts?: string[];
  itemNames: string[];
  questIds: (number | string)[];
  /**
   * Mapping of quest ID to selected item ID for reward selection.
   */
  questItemIds?: Record<number, number>;
  rejectElse: boolean;
};

export enum WindowIds {
  Environment = "app-environment",
  FastTravels = "tools-fast-travels",

  Follower = "tools-follower",
  Hotkeys = "app-hotkeys",

  LoaderGrabber = "tools-loader-grabber",

  PacketLogger = "packets-logger",
  PacketSpammer = "packets-spammer",
}

export type LogLevel = "debug" | "error" | "info" | "warn";
export type LogProcess = "main" | "renderer";
export type MainLogEntry = {
  data?: unknown;
  level: LogLevel;
  message: string;
  process: LogProcess;
  scope: string;
  timestamp: number;
};

export type AppLogEntry = {
  level: number;
  lineNumber: number;
  message: string;
  sourceId: string;
  timestamp: number;
};

export type HotkeyConfig = {
  Application?: {
    "Open Environment"?: string;
  };
  General?: {
    "Toggle Autoattack"?: string;
    "Toggle Bank"?: string;
    "Toggle Options Panel"?: string;
    "Toggle Top Bar"?: string;
  };
  Options?: {
    "Toggle Anti-Counter"?: string;
    "Toggle Disable Collisions"?: string;
    "Toggle Disable Death Ads"?: string;
    "Toggle Disable FX"?: string;
    "Toggle Enemy Magnet"?: string;
    "Toggle Hide Players"?: string;
    "Toggle Infinite Range"?: string;
    "Toggle Lag Killer"?: string;
    "Toggle Provoke Cell"?: string;
    "Toggle Skip Cutscenes"?: string;
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
