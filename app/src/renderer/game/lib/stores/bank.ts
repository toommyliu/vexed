import { Collection } from "@vexed/collection";
import { BankItem, type ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<number, BankItem>();

export const bank: Store<number, BankItem, ItemData> = {
  all: () => store,
  has: (key: number) => store.has(key),
  get: (key: number) => store.get(key),
  add: (item: ItemData) => store.set(item.ItemID, new BankItem(item)),
  remove: (key: number) => store.delete(key),

  getByName: (name: string) =>
    store.find((item) => equalsIgnoreCase(item.data.sName, name)),
  getById: (id: number) => store.get(id),
  findBy: (predicate: (value: BankItem) => boolean) => store.find(predicate),
};
