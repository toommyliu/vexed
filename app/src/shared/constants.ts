import os from "os";
import { join } from "path";
import type { Account, FastTravel, Settings, HotkeyConfig } from "./types";

const isMac = process.platform === "darwin";

export const BRAND = "vexed";
export const DOCUMENTS_PATH = join(os.homedir(), "Documents", BRAND);

export const FAST_TRAVELS_PATH = join(DOCUMENTS_PATH, "fast-travels.json");
export const ACCOUNTS_PATH = join(DOCUMENTS_PATH, "accounts.json");
export const STORAGE_PATH = join(DOCUMENTS_PATH, "storage");

export const DEFAULT_SETTINGS: Settings = {
  launchMode: "game",
  debug: false,
  checkForUpdates: false,
} as const;

export const DEFAULT_SKILLSETS = {
  "Legion Revenant": "3;4;1;2",
};

export const DEFAULT_FAST_TRAVELS: FastTravel[] = [
  { name: "Oblivion", map: "tercessuinotlim" },
  {
    name: "Twins",
    map: "tercessuinotlim",
    cell: "Twins",
    pad: "Left",
  },
  {
    name: "VHL/Taro/Zee",
    map: "tercessuinotlim",
    cell: "Taro",
    pad: "Left",
  },
  {
    name: "Swindle",
    map: "tercessuinotlim",
    cell: "Swindle",
    pad: "Left",
  },
  {
    name: "Nulgath/Skew",
    map: "tercessuinotlim",
    cell: "Boss2",
    pad: "Right",
  },
  {
    name: "Polish",
    map: "tercessuinotlim",
    cell: "m12",
    pad: "Top",
  },
  {
    name: "Carnage/Ninja",
    map: "tercessuinotlim",
    cell: "m4",
    pad: "Top",
  },
  {
    name: "Binky",
    map: "doomvault",
    cell: "r5",
    pad: "Left",
  },
  {
    name: "Dage",
    map: "underworld",
    cell: "s1",
    pad: "Left",
  },
  {
    name: "Escherion",
    map: "escherion",
    cell: "Boss",
    pad: "Left",
  },
] as const;

export const DEFAULT_ACCOUNTS: Account[] = [] as const;

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  General: {
    "Toggle Bank": isMac ? "command+b" : "ctrl+b",
    "Toggle Top Bar": isMac ? "command+shift+t" : "ctrl+shift+t",
  },
  Scripts: {
    "Load Script": "",
    "Toggle Command Overlay": "`",
    "Toggle Dev Tools": isMac ? "command+shift+i" : "ctrl+shift+i",
    "Toggle Script": "",
  },
  Tools: {
    "Open Fast Travels": "",
    "Open Follower": "",
    "Open Loader Grabber": "",
  },
  Packets: {
    "Open Packet Logger": "",
    "Open Packet Spammer": "",
  },
} as const;

export const ARTIX_USERAGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36" as const;

export const WHITELISTED_DOMAINS = [
  "aq.com",
  "artix.com",
  "account.aq.com",
  "aqwwiki.wikidot.com",
  "heromart.com",
];
