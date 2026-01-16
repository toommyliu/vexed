import { Collection } from "@vexed/collection";
import { InventoryItem, type ItemData } from "@vexed/game";
import type { Store } from "./store";

const store = new Collection<number, InventoryItem>();

export const inventory: Store<number, InventoryItem, ItemData> = {
  all: () => store,
  has: (id: number) => store.has(id),
  get: (id: number) => store.get(id),
  add: (item: ItemData) => store.set(item.ItemID, new InventoryItem(item)),
  remove: (id: number) => store.delete(id),

  getByName: (name: string) => store.find((item) => item.name === name),
  getById: (id: number) => store.get(id),
  findBy: (predicate: (value: InventoryItem) => boolean) =>
    store.find(predicate),
};
