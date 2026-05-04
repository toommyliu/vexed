export type CommandScope = "game";

export type CommandCategory =
  | "Application"
  | "Scripts"
  | "Options"
  | "Tools"
  | "Packets";

export type GameCommandId =
  | "load-script"
  | "toggle-script"
  | "stop-script"
  | "open-environment"
  | "open-fast-travels"
  | "open-loader-grabber"
  | "open-follower"
  | "open-packet-logger"
  | "open-packet-spammer"
  | "toggle-autoattack"
  | "toggle-infinite-range"
  | "toggle-provoke-cell"
  | "toggle-enemy-magnet"
  | "toggle-lag-killer"
  | "toggle-hide-players"
  | "toggle-skip-cutscenes"
  | "toggle-disable-fx"
  | "toggle-disable-collisions"
  | "toggle-disable-death-ads";

export interface CommandDefinition {
  readonly id: GameCommandId;
  readonly scope: CommandScope;
  readonly category: CommandCategory;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly defaultHotkey: string;
}

export type DefaultHotkeyBindings = Partial<Record<GameCommandId, string>>;

export const GAME_COMMANDS: readonly CommandDefinition[] = [
  {
    id: "load-script",
    scope: "game",
    category: "Scripts",
    label: "Load Script",
    keywords: ["open", "script"],
    defaultHotkey: "Mod+O",
  },
  {
    id: "toggle-script",
    scope: "game",
    category: "Scripts",
    label: "Start or Stop Script",
    keywords: ["run", "start", "stop", "script"],
    defaultHotkey: "",
  },
  {
    id: "stop-script",
    scope: "game",
    category: "Scripts",
    label: "Stop Script",
    keywords: ["halt", "script"],
    defaultHotkey: "Mod+Shift+X",
  },
  {
    id: "open-environment",
    scope: "game",
    category: "Application",
    label: "Open Environment",
    keywords: ["window", "runtime", "state"],
    defaultHotkey: "Mod+E",
  },
  {
    id: "open-fast-travels",
    scope: "game",
    category: "Tools",
    label: "Open Fast Travels",
    keywords: ["window", "travel", "map"],
    defaultHotkey: "",
  },
  {
    id: "open-loader-grabber",
    scope: "game",
    category: "Tools",
    label: "Open Loader/Grabber",
    keywords: ["window", "loader", "grabber", "asset"],
    defaultHotkey: "",
  },
  {
    id: "open-follower",
    scope: "game",
    category: "Tools",
    label: "Open Follower",
    keywords: ["window", "follow"],
    defaultHotkey: "",
  },
  {
    id: "open-packet-logger",
    scope: "game",
    category: "Packets",
    label: "Open Packet Logger",
    keywords: ["window", "log", "capture"],
    defaultHotkey: "",
  },
  {
    id: "open-packet-spammer",
    scope: "game",
    category: "Packets",
    label: "Open Packet Spammer",
    keywords: ["window", "send", "spam"],
    defaultHotkey: "",
  },
  {
    id: "toggle-autoattack",
    scope: "game",
    category: "Options",
    label: "Toggle Autoattack",
    keywords: ["auto", "attack"],
    defaultHotkey: "",
  },
  {
    id: "toggle-infinite-range",
    scope: "game",
    category: "Options",
    label: "Toggle Infinite Range",
    keywords: ["range"],
    defaultHotkey: "Alt+I",
  },
  {
    id: "toggle-provoke-cell",
    scope: "game",
    category: "Options",
    label: "Toggle Provoke Cell",
    keywords: ["provoke", "cell"],
    defaultHotkey: "",
  },
  {
    id: "toggle-enemy-magnet",
    scope: "game",
    category: "Options",
    label: "Toggle Enemy Magnet",
    keywords: ["enemy", "magnet"],
    defaultHotkey: "",
  },
  {
    id: "toggle-lag-killer",
    scope: "game",
    category: "Options",
    label: "Toggle Lag Killer",
    keywords: ["lag"],
    defaultHotkey: "Alt+L",
  },
  {
    id: "toggle-hide-players",
    scope: "game",
    category: "Options",
    label: "Toggle Hide Players",
    keywords: ["players", "visibility"],
    defaultHotkey: "",
  },
  {
    id: "toggle-skip-cutscenes",
    scope: "game",
    category: "Options",
    label: "Toggle Skip Cutscenes",
    keywords: ["cutscene"],
    defaultHotkey: "",
  },
  {
    id: "toggle-disable-fx",
    scope: "game",
    category: "Options",
    label: "Toggle Disable FX",
    keywords: ["effects", "fx"],
    defaultHotkey: "",
  },
  {
    id: "toggle-disable-collisions",
    scope: "game",
    category: "Options",
    label: "Toggle Disable Collisions",
    keywords: ["collision"],
    defaultHotkey: "",
  },
  {
    id: "toggle-disable-death-ads",
    scope: "game",
    category: "Options",
    label: "Toggle Disable Death Ads",
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
  Object.fromEntries(
    GAME_COMMANDS.map((command) => [command.id, command.defaultHotkey]),
  ) as DefaultHotkeyBindings;
