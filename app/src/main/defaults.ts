import type { FastTravel } from "~/shared/fast-travels/types";
import type { Settings } from "~/shared/settings/types";

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

export const DEFAULT_SETTINGS: Settings = {
  checkForUpdates: false,
  customTheme: {},
  debug: false,
  fallbackServer: "",
  launchMode: "game",
  theme: "dark",
};
