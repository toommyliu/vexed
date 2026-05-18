export type CommandScope = "game";

export type CommandCategory =
  | "Application"
  | "Scripts"
  | "Options"
  | "Tools"
  | "Packets";

export type GameCommandId =
  | "toggleTopBar"
  | "loadScript"
  | "toggleScript"
  | "stopScript"
  | "openOptionsMenu"
  | "openEnvironment"
  | "openFastTravels"
  | "openLoaderGrabber"
  | "openFollower"
  | "openPacketLogger"
  | "openPacketSpammer"
  | "toggleAutoattack"
  | "toggleInfiniteRange"
  | "toggleProvokeCell"
  | "toggleEnemyMagnet"
  | "toggleLagKiller"
  | "toggleHidePlayers"
  | "toggleSkipCutscenes"
  | "toggleDisableFx"
  | "toggleCollisions"
  | "toggleDeathAds";

export interface CommandDefinition {
  readonly id: GameCommandId;
  readonly scope: CommandScope;
  readonly category: CommandCategory;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly defaultHotkey: string;
}

export type DefaultHotkeyBindings = readonly {
  readonly id: GameCommandId;
  readonly value: string;
}[];

export const GAME_COMMANDS: readonly CommandDefinition[] = [
  {
    id: "toggleTopBar",
    scope: "game",
    category: "Application",
    label: "Toggle Top Bar",
    keywords: ["top", "bar", "navigation", "chrome"],
    defaultHotkey: "Mod+Shift+T",
  },
  {
    id: "loadScript",
    scope: "game",
    category: "Scripts",
    label: "Load Script",
    keywords: ["open", "script"],
    defaultHotkey: "Mod+O",
  },
  {
    id: "toggleScript",
    scope: "game",
    category: "Scripts",
    label: "Start or Stop Script",
    keywords: ["run", "start", "stop", "script"],
    defaultHotkey: "",
  },
  {
    id: "stopScript",
    scope: "game",
    category: "Scripts",
    label: "Stop Script",
    keywords: ["halt", "script"],
    defaultHotkey: "Mod+Shift+X",
  },
  {
    id: "openOptionsMenu",
    scope: "game",
    category: "Options",
    label: "Open Options Menu",
    keywords: ["menu", "options", "settings"],
    defaultHotkey: "Mod+Shift+,",
  },
  {
    id: "openEnvironment",
    scope: "game",
    category: "Tools",
    label: "Open Environment",
    keywords: ["window", "runtime", "state"],
    defaultHotkey: "Mod+E",
  },
  {
    id: "openFastTravels",
    scope: "game",
    category: "Tools",
    label: "Open Fast Travels",
    keywords: ["window", "travel", "map"],
    defaultHotkey: "",
  },
  {
    id: "openLoaderGrabber",
    scope: "game",
    category: "Tools",
    label: "Open Loader/Grabber",
    keywords: ["window", "loader", "grabber", "asset"],
    defaultHotkey: "",
  },
  {
    id: "openFollower",
    scope: "game",
    category: "Tools",
    label: "Open Follower",
    keywords: ["window", "follow"],
    defaultHotkey: "",
  },
  {
    id: "openPacketLogger",
    scope: "game",
    category: "Packets",
    label: "Open Packet Logger",
    keywords: ["window", "log", "capture"],
    defaultHotkey: "",
  },
  {
    id: "openPacketSpammer",
    scope: "game",
    category: "Packets",
    label: "Open Packet Spammer",
    keywords: ["window", "send", "spam"],
    defaultHotkey: "",
  },
  {
    id: "toggleAutoattack",
    scope: "game",
    category: "Options",
    label: "Toggle Autoattack",
    keywords: ["auto", "attack"],
    defaultHotkey: "",
  },
  {
    id: "toggleInfiniteRange",
    scope: "game",
    category: "Options",
    label: "Toggle Infinite Range",
    keywords: ["range"],
    defaultHotkey: "Alt+I",
  },
  {
    id: "toggleProvokeCell",
    scope: "game",
    category: "Options",
    label: "Toggle Provoke Cell",
    keywords: ["provoke", "cell"],
    defaultHotkey: "",
  },
  {
    id: "toggleEnemyMagnet",
    scope: "game",
    category: "Options",
    label: "Toggle Enemy Magnet",
    keywords: ["enemy", "magnet"],
    defaultHotkey: "",
  },
  {
    id: "toggleLagKiller",
    scope: "game",
    category: "Options",
    label: "Toggle Lag Killer",
    keywords: ["lag"],
    defaultHotkey: "Alt+L",
  },
  {
    id: "toggleHidePlayers",
    scope: "game",
    category: "Options",
    label: "Toggle Hide Players",
    keywords: ["players", "visibility"],
    defaultHotkey: "",
  },
  {
    id: "toggleSkipCutscenes",
    scope: "game",
    category: "Options",
    label: "Toggle Skip Cutscenes",
    keywords: ["cutscene"],
    defaultHotkey: "",
  },
  {
    id: "toggleDisableFx",
    scope: "game",
    category: "Options",
    label: "Toggle Disable FX",
    keywords: ["effects", "fx"],
    defaultHotkey: "",
  },
  {
    id: "toggleCollisions",
    scope: "game",
    category: "Options",
    label: "Toggle Collisions",
    keywords: ["collision"],
    defaultHotkey: "",
  },
  {
    id: "toggleDeathAds",
    scope: "game",
    category: "Options",
    label: "Toggle Death Ads",
    keywords: ["death", "ads"],
    defaultHotkey: "",
  },
] as const;

export const GAME_COMMAND_IDS: readonly GameCommandId[] = GAME_COMMANDS.map(
  (command) => command.id,
);

const gameCommandIds = new Set<string>(GAME_COMMAND_IDS);
const gameCommandDefinitions = new Map<GameCommandId, CommandDefinition>(
  GAME_COMMANDS.map((command) => [command.id, command]),
);

export const isGameCommandId = (value: unknown): value is GameCommandId =>
  typeof value === "string" && gameCommandIds.has(value);

export const getCommandDefinition = (id: GameCommandId): CommandDefinition => {
  const definition = gameCommandDefinitions.get(id);
  if (!definition) {
    throw new Error(`Unknown game command: ${id}`);
  }

  return definition;
};

export const getDefaultHotkeys = (): DefaultHotkeyBindings =>
  GAME_COMMANDS.map((command) => ({
    id: command.id,
    value: command.defaultHotkey,
  }));
