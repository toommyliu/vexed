import { Collection } from "@vexed/collection";
import { TempInventoryItem, type ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<number, TempInventoryItem>();

export const tempInventory: Store<number, TempInventoryItem, ItemData> = {
  all: () => store,
  clear: () => store.clear(),
  has: (key: number) => store.has(key),
  get: (key: number) => store.get(key),
  add: (data: ItemData) => store.set(data.ItemID, new TempInventoryItem(data)),
  set: (id: number, data: ItemData) =>
    store.set(id, new TempInventoryItem(data)),
  remove: (key: number) => store.delete(key),

  getByName: (name: string) =>
    store.find((item) => equalsIgnoreCase(item.name, name)),
  findBy: (predicate: (value: TempInventoryItem) => boolean) =>
    store.find(predicate),
};
