export const WindowIds = {
  AccountManager: "account-manager",
  Settings: "settings",
  Environment: "environment",
  FastTravels: "fast-travels",
  LoaderGrabber: "loader-grabber",
  Follower: "follower",
  PacketLogger: "packet-logger",
  PacketSpammer: "packet-spammer",
} as const;

export type WindowId = (typeof WindowIds)[keyof typeof WindowIds];
export type WindowScope = "app" | "game-child";
export type WindowCloseBehavior = "hide" | "destroy";

export interface WindowDimensions {
  readonly width: number;
  readonly height: number;
  readonly minWidth?: number;
  readonly minHeight?: number;
}

export interface WindowDefinition {
  readonly id: WindowId;
  readonly label: string;
  readonly description: string;
  readonly scope: WindowScope;
  readonly closeBehavior: WindowCloseBehavior;
  readonly dimensions: WindowDimensions;
}

export interface WindowGroup {
  readonly name: string;
  readonly items: readonly WindowDefinition[];
}

export const appWindowGroups: readonly WindowGroup[] = [
  {
    name: "Application",
    items: [
      {
        id: WindowIds.AccountManager,
        label: "Account Manager",
        description: "Manage saved accounts and launch game sessions.",
        scope: "app",
        closeBehavior: "hide",
        dimensions: {
          width: 966,
          height: 552,
        },
      },
      {
        id: WindowIds.Settings,
        label: "Settings",
        description: "Configure Vexed application preferences.",
        scope: "app",
        closeBehavior: "hide",
        dimensions: {
          width: 651,
          height: 654,
        },
      },
    ],
  },
] as const;

export const gameWindowGroups: readonly WindowGroup[] = [
  {
    name: "Application",
    items: [
      {
        id: WindowIds.Environment,
        label: "Environment",
        description: "Inspect and adjust shared runtime environment state.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 778,
          height: 593,
        },
      },
    ],
  },
  {
    name: "Tools",
    items: [
      {
        id: WindowIds.FastTravels,
        label: "Fast travels",
        description: "Open fast-travel helpers for the active game window.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 649,
          height: 527,
        },
      },
      {
        id: WindowIds.LoaderGrabber,
        label: "Loader/grabber",
        description: "Load and inspect external game assets.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 600,
          height: 546,
        },
      },
      {
        id: WindowIds.Follower,
        label: "Follower",
        description: "Coordinate follower behavior for the active game.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 648,
          height: 496,
        },
      },
    ],
  },
  {
    name: "Packets",
    items: [
      {
        id: WindowIds.PacketLogger,
        label: "Logger",
        description: "Capture packets for the active game window.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 643,
          height: 534,
        },
      },
      {
        id: WindowIds.PacketSpammer,
        label: "Spammer",
        description: "Send packet payloads to the active game window.",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 641,
          height: 542,
        },
      },
    ],
  },
] as const;

export const allWindowGroups: readonly WindowGroup[] = [
  ...appWindowGroups,
  ...gameWindowGroups,
];

const windowDefinitions = new Map<WindowId, WindowDefinition>(
  allWindowGroups.flatMap((group) =>
    group.items.map((item) => [item.id, item]),
  ),
);

export const getWindowDefinition = (
  id: WindowId,
): WindowDefinition | undefined => windowDefinitions.get(id);

export const isWindowId = (value: unknown): value is WindowId =>
  typeof value === "string" && windowDefinitions.has(value as WindowId);

export const isAppWindowDefinition = (definition: WindowDefinition): boolean =>
  definition.scope === "app";

export const isGameChildWindowDefinition = (
  definition: WindowDefinition,
): boolean => definition.scope === "game-child";
