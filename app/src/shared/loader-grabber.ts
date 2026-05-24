import type { ItemData, MonsterData, QuestInfo, ShopInfo } from "@vexed/game";

export const LoaderGrabberLoadTypes = [
  "hair-shop",
  "shop",
  "quest",
  "armor-customizer",
] as const;

export const LoaderGrabberGrabTypes = [
  "shop",
  "quest",
  "inventory",
  "temp-inventory",
  "bank",
  "cell-monsters",
  "map-monsters",
] as const;

export type LoaderGrabberLoadType = (typeof LoaderGrabberLoadTypes)[number];
export type LoaderGrabberGrabType = (typeof LoaderGrabberGrabTypes)[number];

export type LoaderGrabberLoadRequest =
  | {
      readonly id: number;
      readonly type: Exclude<LoaderGrabberLoadType, "armor-customizer">;
    }
  | {
      readonly type: "armor-customizer";
    };

export interface LoaderGrabberGrabRequest {
  readonly type: LoaderGrabberGrabType;
}

export interface GrabbedDataByType {
  readonly shop: ShopInfo;
  readonly quest: readonly QuestInfo[];
  readonly inventory: readonly ItemData[];
  readonly "temp-inventory": readonly ItemData[];
  readonly bank: readonly ItemData[];
  readonly "cell-monsters": readonly MonsterData[];
  readonly "map-monsters": readonly MonsterData[];
}

export type GrabbedData = GrabbedDataByType[LoaderGrabberGrabType];

export class LoaderGrabberValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoaderGrabberValidationError";
  }
}

const loadTypes = new Set<string>(LoaderGrabberLoadTypes);
const grabTypes = new Set<string>(LoaderGrabberGrabTypes);

export const isLoaderGrabberLoadType = (
  value: unknown,
): value is LoaderGrabberLoadType =>
  typeof value === "string" && loadTypes.has(value);

export const isLoaderGrabberGrabType = (
  value: unknown,
): value is LoaderGrabberGrabType =>
  typeof value === "string" && grabTypes.has(value);

export const loaderGrabberLoadRequiresId = (
  type: LoaderGrabberLoadType | null | undefined,
): boolean => type === "hair-shop" || type === "shop" || type === "quest";

const positiveInteger = (value: unknown): number | undefined => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

export const normalizeLoaderGrabberLoadRequest = (
  value: unknown,
): LoaderGrabberLoadRequest => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const type = record["type"];

  if (!isLoaderGrabberLoadType(type)) {
    throw new LoaderGrabberValidationError("Invalid loader source");
  }

  if (type === "armor-customizer") {
    return { type };
  }

  const id = positiveInteger(record["id"]);
  if (id === undefined) {
    throw new LoaderGrabberValidationError(
      "Loader ID must be a positive integer",
    );
  }

  return {
    id,
    type,
  };
};

export const normalizeLoaderGrabberGrabRequest = (
  value: unknown,
): LoaderGrabberGrabRequest => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const type = record["type"];

  if (!isLoaderGrabberGrabType(type)) {
    throw new LoaderGrabberValidationError("Invalid grabber source");
  }

  return { type };
};
