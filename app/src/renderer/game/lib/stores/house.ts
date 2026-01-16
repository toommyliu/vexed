import { Collection } from "@vexed/collection";
import { HouseItem, type ItemData } from "@vexed/game";
import type { Store } from "./store";

const store = new Collection<number, HouseItem>();

export const house: Store<number, HouseItem, ItemData> = {
  all: () => store,
  has: (key: number) => store.has(key),
  get: (key: number) => store.get(key),
  add: (item: ItemData) => store.set(item.ItemID, new HouseItem(item)),
  remove: (key: number) => store.delete(key),

  getByName: (name: string) =>
    store.find((item) => item.name.toLowerCase() === name.toLowerCase()),
  getById: (id: number) => store.get(id),
  findBy: (predicate: (value: HouseItem) => boolean) => store.find(predicate),
};
