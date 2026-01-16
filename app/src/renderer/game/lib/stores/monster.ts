import { Collection } from "@vexed/collection";
import { Monster, type MonsterData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils";
import type { Store } from "./store";

const store = new Collection<number, Monster>();

export const monsters: Store<number, Monster, MonsterData> = {
  all: () => store,
  has: (key: number) => store.has(key),
  get: (key: number) => store.get(key),
  add: (mon: MonsterData) => store.set(mon.monMapId, new Monster(mon)),
  remove: (key: number) => store.delete(key),

  getByName: (name: string) =>
    store.find((monster) => equalsIgnoreCase(monster.name, name)),
  getById: (id: number) => store.find((monster) => monster.id === id),
  findBy: (predicate: (value: Monster) => boolean) => store.find(predicate),
};
