import { Collection } from "@vexed/collection";
import { InventoryItem, type ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<number, InventoryItem>();

export const inventory: Store<number, InventoryItem, ItemData> = {
  all: () => store,
  clear: () => store.clear(),
  has: (id: number) => store.has(id),
  get: (id: number) => store.get(id),
  add: (item: ItemData) => store.set(item.ItemID, new InventoryItem(item)),
  set: (id: number, item: ItemData) => store.set(id, new InventoryItem(item)),
  remove: (id: number) => store.delete(id),

  getByName: (name: string) =>
    store.find((item) => equalsIgnoreCase(item.name, name)),
  findBy: (predicate: (value: InventoryItem) => boolean) =>
    store.find(predicate),
};
