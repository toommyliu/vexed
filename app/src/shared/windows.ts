export const WindowIds = {
  AccountManager: "account-manager",
  Settings: "settings",
  Environment: "environment",
  Skills: "skills",
  FastTravels: "fast-travels",
  LoaderGrabber: "loader-grabber",
  Follower: "follower",
  Packets: "packets",
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
        id: WindowIds.Skills,
        label: "Skills",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 760,
          height: 560,
          minWidth: 680,
          minHeight: 500,
        },
      },
    ],
  },
  {
    name: "Tools",
    items: [
      {
        id: WindowIds.Environment,
        label: "Environment",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 778,
          height: 593,
        },
      },
      {
        id: WindowIds.Follower,
        label: "Follower",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 648,
          height: 496,
          minWidth: 560,
          minHeight: 420,
        },
      },
      {
        id: WindowIds.LoaderGrabber,
        label: "Loader/grabber",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 712,
          height: 710,
        },
      },
      {
        id: WindowIds.FastTravels,
        label: "Fast travels",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 649,
          height: 527,
        },
      },
    ],
  },
  {
    name: "Packets",
    items: [
      {
        id: WindowIds.Packets,
        label: "Packets",
        scope: "game-child",
        closeBehavior: "hide",
        dimensions: {
          width: 760,
          height: 560,
          minWidth: 680,
          minHeight: 500,
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
