import {
  Item,
  ShopItem,
  type ItemData,
  type ShopItemData,
} from "@vexed/game";
import { Effect, Ref } from "effect";
import { asArray, asNumber, asRecord, asString } from "./PacketPayload";

type CachedModel<D extends object> = {
  data: D;
};

type ModelCache<T> = {
  readonly clear: Effect.Effect<void>;
  readonly fromUnknown: (value: unknown) => Effect.Effect<T | null>;
  readonly fromUnknownArray: (value: unknown) => Effect.Effect<readonly T[]>;
};

const toItemData = (value: unknown): ItemData | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const itemId = asNumber(record["ItemID"]);
  if (itemId === undefined) {
    return null;
  }

  const charItemId = asNumber(record["CharItemID"]);

  return {
    ...record,
    ItemID: itemId,
    ...(charItemId !== undefined ? { CharItemID: charItemId } : null),
  } as ItemData;
};

const toShopItemId = (value: unknown): string | undefined => {
  const id = asString(value);
  if (id !== undefined && id.trim() !== "") {
    return id;
  }

  const numericId = asNumber(value);
  return numericId !== undefined ? String(numericId) : undefined;
};

const toShopItemData = (value: unknown): ShopItemData | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const itemData = toItemData(record);
  if (!itemData) {
    return null;
  }

  const shopItemId = toShopItemId(record["ShopItemID"]);

  return {
    ...record,
    ...itemData,
    ...(shopItemId !== undefined ? { ShopItemID: shopItemId } : null),
  } as ShopItemData;
};

const makeItemKey = (data: ItemData): string => {
  const charItemId = asNumber(data.CharItemID);
  if (charItemId !== undefined && charItemId > 0) {
    return `char:${charItemId}`;
  }

  return `item:${data.ItemID}`;
};

const makeShopItemKey = (data: ShopItemData): string => {
  const shopItemId = toShopItemId(data.ShopItemID);
  if (shopItemId !== undefined) {
    return `shop:${shopItemId}`;
  }

  return makeItemKey(data);
};

const upsertModel = <D extends object, T extends CachedModel<D>>(
  models: Map<string, T>,
  modelKey: string,
  data: D,
  create: (data: D) => T,
): T => {
  const cached = models.get(modelKey);
  if (cached) {
    cached.data = data;
    return cached;
  }

  const model = create(data);
  models.set(modelKey, model);
  return model;
};

const makeModelCache = <D extends object, T extends CachedModel<D>>({
  toData,
  makeKey,
  create,
}: {
  readonly toData: (value: unknown) => D | null;
  readonly makeKey: (data: D) => string;
  readonly create: (data: D) => T;
}): Effect.Effect<ModelCache<T>> =>
  Effect.gen(function* () {
    const modelsRef = yield* Ref.make(new Map<string, T>());
    const presentKeys = new Set<string>();

    const clear = Ref.update(modelsRef, (models) => {
      models.clear();
      return models;
    });

    const fromUnknown = (value: unknown) =>
      Ref.modify(modelsRef, (models) => {
        const data = toData(value);
        if (data === null) {
          return [null, models] as const;
        }

        const modelKey = makeKey(data);
        return [upsertModel(models, modelKey, data, create), models] as const;
      });

    const fromUnknownArray = (value: unknown) =>
      Ref.modify(modelsRef, (models) => {
        const rawItems = asArray(value);
        const nextModels: T[] = [];

        presentKeys.clear();

        for (const rawItem of rawItems) {
          const data = toData(rawItem);
          if (data === null) {
            continue;
          }

          const modelKey = makeKey(data);
          presentKeys.add(modelKey);
          nextModels.push(upsertModel(models, modelKey, data, create));
        }

        for (const modelKey of models.keys()) {
          if (!presentKeys.has(modelKey)) {
            models.delete(modelKey);
          }
        }

        return [nextModels, models] as const;
      });

    return {
      clear,
      fromUnknown,
      fromUnknownArray,
    } satisfies ModelCache<T>;
  });

export type ItemCache = ModelCache<Item>;
export type ShopItemCache = ModelCache<ShopItem>;

export const makeItemCache: Effect.Effect<ItemCache> = makeModelCache({
  toData: toItemData,
  makeKey: makeItemKey,
  create: (data) => new Item(data),
});

export const makeShopItemCache: Effect.Effect<ShopItemCache> = makeModelCache({
  toData: toShopItemData,
  makeKey: makeShopItemKey,
  create: (data) => new ShopItem(data),
});
