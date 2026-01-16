import { Collection } from "@vexed/collection";
import { HouseItem, type ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<number, HouseItem>();

export const house: Store<number, HouseItem, ItemData> = {
  all: () => store,
  clear: () => store.clear(),
  has: (key: number) => store.has(key),
  get: (key: number) => store.get(key),
  add: (item: ItemData) => store.set(item.ItemID, new HouseItem(item)),
  set: (id: number, item: ItemData) => store.set(id, new HouseItem(item)),
  remove: (key: number) => store.delete(key),

  getByName: (name: string) =>
    store.find((item) => equalsIgnoreCase(item.name, name)),
  findBy: (predicate: (value: HouseItem) => boolean) => store.find(predicate),
};
