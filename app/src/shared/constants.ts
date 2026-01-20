import os from "os";
import { join } from "path";
import process from "process";
import type { Account, FastTravel, HotkeyConfig } from "./types";

export const IS_WINDOWS = process.platform === "win32";
export const IS_MAC = process.platform === "darwin";

export const BRAND = "vexed";
export const DOCUMENTS_PATH = join(os.homedir(), "Documents", BRAND);

export const FAST_TRAVELS_PATH = join(DOCUMENTS_PATH, "fast-travels.json");

export const STORAGE_PATH = join(DOCUMENTS_PATH, "storage");

export const DEFAULT_SKILLSETS = {
  "Legion Revenant": {
    skills: [3, 4, 1, 2],
  },
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

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  General: {
    "Toggle Autoattack": "",
    "Toggle Bank": IS_MAC ? "command+b" : "ctrl+b",
    "Toggle Options Panel": IS_MAC ? "command+," : "ctrl+,",
    "Toggle Top Bar": IS_MAC ? "command+shift+t" : "ctrl+shift+t",
  },
  Application: {
    "Open Environment": IS_MAC ? "command+e" : "ctrl+e",
  },
  Options: {
    "Toggle Infinite Range": "alt+i",
    "Toggle Provoke Cell": "",
    "Toggle Enemy Magnet": "",
    "Toggle Lag Killer": "alt+l",
    "Toggle Hide Players": "",
    "Toggle Skip Cutscenes": "",
    "Toggle Disable FX": "",
    "Toggle Disable Collisions": "",
    "Toggle Anti-Counter": "",
    "Toggle Disable Death Ads": "",
  },
  Scripts: {
    "Load Script": "",
    "Toggle Command Overlay": "`",
    "Toggle Dev Tools": IS_MAC ? "command+shift+i" : "ctrl+shift+i",
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
