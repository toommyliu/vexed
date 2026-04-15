import { Item, type ItemData } from "@vexed/game";
import { Effect, Ref } from "effect";
import { asArray, asNumber, asRecord } from "./PacketPayload";

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

const makeItemKey = (data: ItemData): string => {
  // Bank and inventory items
  const charItemId = asNumber(data.CharItemID);
  if (charItemId !== undefined && charItemId > 0) {
    return `char:${charItemId}`;
  }

  // Temporary items
  return `item:${data.ItemID}`;
};

const upsertItem = (
  items: Map<string, Item>,
  itemKey: string,
  data: ItemData,
): Item => {
  const cached = items.get(itemKey);
  if (cached) {
    cached.data = data;
    return cached;
  }

  const item = new Item(data);
  items.set(itemKey, item);
  return item;
};

export interface ItemCache {
  readonly clear: Effect.Effect<void>;
  readonly fromUnknown: (value: unknown) => Effect.Effect<Item | null>;
  readonly fromUnknownArray: (value: unknown) => Effect.Effect<readonly Item[]>;
}

export const makeItemCache = Effect.gen(function* () {
  const itemsRef = yield* Ref.make(new Map<string, Item>());
  const presentKeys = new Set<string>();

  const clear = Ref.update(itemsRef, (items) => {
    items.clear();
    return items;
  });

  const fromUnknown = (value: unknown) =>
    Ref.modify(itemsRef, (items) => {
      const data = toItemData(value);
      if (!data) {
        return [null, items] as const;
      }

      const itemKey = makeItemKey(data);
      return [upsertItem(items, itemKey, data), items] as const;
    });

  const fromUnknownArray = (value: unknown) =>
    Ref.modify(itemsRef, (items) => {
      const rawItems = asArray(value);
      const nextItems: Item[] = [];

      presentKeys.clear();

      for (const rawItem of rawItems) {
        const data = toItemData(rawItem);
        if (!data) {
          continue;
        }

        const itemKey = makeItemKey(data);
        presentKeys.add(itemKey);
        nextItems.push(upsertItem(items, itemKey, data));
      }

      for (const itemKey of items.keys()) {
        if (!presentKeys.has(itemKey)) {
          items.delete(itemKey);
        }
      }

      return [nextItems, items] as const;
    });

  return {
    clear,
    fromUnknown,
    fromUnknownArray,
  } satisfies ItemCache;
});
