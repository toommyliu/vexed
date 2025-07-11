import os from "os";
import { join } from "path";
import type { Account, HotkeyConfig, Settings } from "./types";

const isMac = process.platform === "darwin";

export const BRAND = "vexed";
export const DOCUMENTS_PATH = join(os.homedir(), "Documents", BRAND);

export const DEFAULT_SETTINGS: Settings = {
  launchMode: "game",
  debug: false,
} as const;

export const DEFAULT_ACCOUNTS: Account[] = [] as const;

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  General: {
    "Toggle Bank": isMac ? "command+b" : "ctrl+b",
    "Toggle Auto Aggro": "",
    "Toggle Top Bar": isMac ? "command+shift+t" : "ctrl+shift+t",
  },
  Scripts: {
    "Load Script": "",
    "Toggle Command Overlay": "`",
    "Toggle Dev Tools": isMac ? "command+shift+i" : "ctrl+shift+i",
    "Toggle Script": "",
  },
  Tools: {
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
  "www.aq.com",
  "aq.com",
  "www.artix.com",
  "artix.com",
  "www.account.aq.com",
  "account.aq.com",
  "www.aqwwiki.wikidot.com",
  "aqwwiki.wikidot.com",
  "heromart.com",
  "www.heromart.com",
];
