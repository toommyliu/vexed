import { Collection } from "@vexed/collection";
import { TempInventoryItem, type ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<string, TempInventoryItem>();

export const tempInventory: Store<string, TempInventoryItem, ItemData> = {
  all: () => store,
  has: (key: string) => store.has(key),
  get: (key: string) => store.get(key),
  add: (data: ItemData) =>
    store.set(String(data.CharItemID), new TempInventoryItem(data)),
  remove: (key: string) => store.delete(key),

  getByName: (name: string) =>
    store.find((item) => equalsIgnoreCase(item.name, name)),
  getById: (id: number) => store.find((item) => item.id === id),
  findBy: (predicate: (value: TempInventoryItem) => boolean) =>
    store.find(predicate),
};
