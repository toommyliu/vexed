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
   * The launch mode of the application.
   */
  launchMode: "game" | "manager";
};

export type EnvironmentState = {
  autoRegisterRequirements: boolean;
  autoRegisterRewards: boolean;
  boosts: string[];
  itemNames: string[];
  questIds: number[];
  rejectElse: boolean;
};

export type EnvironmentUpdatePayload = {
  autoRegisterRequirements?: boolean;
  autoRegisterRewards?: boolean;
  boosts?: string[];
  itemNames: string[];
  questIds: (number | string)[];
  rejectElse: boolean;
};

export enum WindowIds {
  AppLogs = "app-logs",
  Environment = "app-environment",
  FastTravels = "tools-fast-travels",

  Follower = "tools-follower",
  Hotkeys = "app-hotkeys",

  LoaderGrabber = "tools-loader-grabber",

  PacketLogger = "packets-logger",
  PacketSpammer = "packets-spammer",
}

export type AppLogEntry = {
  level: number;
  lineNumber: number;
  message: string;
  sourceId: string;
  timestamp: number;
};

export type HotkeyConfig = {
  Application?: {
    "Open App Logs"?: string;
    "Open Environment"?: string;
  };
  General?: {
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
    "Open App Logs"?: string;
    "Open Fast Travels"?: string;
    "Open Follower"?: string;
    "Open Loader Grabber"?: string;
  };
};
