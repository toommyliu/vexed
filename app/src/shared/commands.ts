export type CommandScope = "game";

export type CommandCategory =
  | "General"
  | "Scripts"
  | "Options"
  | "Tools"
  | "Packets";

export type GameCommandId =
  | "toggleTopBar"
  | "loadScript"
  | "toggleScript"
  | "stopScript"
  | "toggleOptionsMenu"
  | "openEnvironment"
  | "openFastTravels"
  | "openLoaderGrabber"
  | "openFollower"
  | "openPackets"
  | "toggleAutoattack"
  | "toggleFollower"
  | "toggleBank"
  | "toggleInfiniteRange"
  | "toggleProvokeCell"
  | "toggleEnemyMagnet"
  | "toggleLagKiller"
  | "toggleHidePlayers"
  | "toggleSkipCutscenes"
  | "toggleAntiCounter"
  | "toggleDisableFx"
  | "toggleCollisions"
  | "toggleDeathAds";

export interface CommandDefinition {
  readonly id: GameCommandId;
  readonly scope: CommandScope;
  readonly category: CommandCategory;
  readonly label: string;
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
    category: "General",
    label: "Toggle Top Bar",
    defaultHotkey: "Mod+Shift+T",
  },
  {
    id: "loadScript",
    scope: "game",
    category: "Scripts",
    label: "Load Script",
    defaultHotkey: "Mod+O",
  },
  {
    id: "toggleScript",
    scope: "game",
    category: "Scripts",
    label: "Start or Stop Script",
    defaultHotkey: "",
  },
  {
    id: "stopScript",
    scope: "game",
    category: "Scripts",
    label: "Stop Script",
    defaultHotkey: "Mod+Shift+X",
  },
  {
    id: "toggleOptionsMenu",
    scope: "game",
    category: "Options",
    label: "Toggle Options Menu",
    defaultHotkey: "Mod+Shift+,",
  },
  {
    id: "openEnvironment",
    scope: "game",
    category: "Tools",
    label: "Open Environment",
    defaultHotkey: "Mod+E",
  },
  {
    id: "openFastTravels",
    scope: "game",
    category: "Tools",
    label: "Open Fast Travels",
    defaultHotkey: "",
  },
  {
    id: "openLoaderGrabber",
    scope: "game",
    category: "Tools",
    label: "Open Loader/Grabber",
    defaultHotkey: "",
  },
  {
    id: "openFollower",
    scope: "game",
    category: "Tools",
    label: "Open Follower Window",
    defaultHotkey: "Alt+F",
  },
  {
    id: "openPackets",
    scope: "game",
    category: "Packets",
    label: "Open Packets",
    defaultHotkey: "",
  },
  {
    id: "toggleAutoattack",
    scope: "game",
    category: "General",
    label: "Toggle Auto Attack",
    defaultHotkey: "Alt+A",
  },
  {
    id: "toggleFollower",
    scope: "game",
    category: "General",
    label: "Toggle Follower Feature",
    defaultHotkey: "Alt+Shift+F",
  },
  {
    id: "toggleBank",
    scope: "game",
    category: "General",
    label: "Toggle Bank",
    defaultHotkey: "Mod+B",
  },
  {
    id: "toggleInfiniteRange",
    scope: "game",
    category: "Options",
    label: "Toggle Infinite Range",
    defaultHotkey: "Alt+I",
  },
  {
    id: "toggleProvokeCell",
    scope: "game",
    category: "Options",
    label: "Toggle Provoke Cell",
    defaultHotkey: "",
  },
  {
    id: "toggleEnemyMagnet",
    scope: "game",
    category: "Options",
    label: "Toggle Enemy Magnet",
    defaultHotkey: "",
  },
  {
    id: "toggleLagKiller",
    scope: "game",
    category: "Options",
    label: "Toggle Lag Killer",
    defaultHotkey: "Alt+L",
  },
  {
    id: "toggleHidePlayers",
    scope: "game",
    category: "Options",
    label: "Toggle Hide Players",
    defaultHotkey: "",
  },
  {
    id: "toggleSkipCutscenes",
    scope: "game",
    category: "Options",
    label: "Toggle Skip Cutscenes",
    defaultHotkey: "",
  },
  {
    id: "toggleAntiCounter",
    scope: "game",
    category: "Options",
    label: "Toggle Anti-Counter",
    defaultHotkey: "",
  },
  {
    id: "toggleDisableFx",
    scope: "game",
    category: "Options",
    label: "Toggle Disable FX",
    defaultHotkey: "",
  },
  {
    id: "toggleCollisions",
    scope: "game",
    category: "Options",
    label: "Toggle Collisions",
    defaultHotkey: "",
  },
  {
    id: "toggleDeathAds",
    scope: "game",
    category: "Options",
    label: "Toggle Death Ads",
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
