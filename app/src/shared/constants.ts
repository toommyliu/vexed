import os from "os";
import { join } from "path";
import process from "process";
import type { FastTravel } from "./types";

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
