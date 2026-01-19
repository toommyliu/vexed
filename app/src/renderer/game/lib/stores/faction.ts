import { Collection } from "@vexed/collection";
import { Faction, type FactionData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { Store } from "./store";

const store = new Collection<string, Faction>();

export const factions: Store<string, Faction, FactionData> = {
  all: () => store,
  clear: () => store.clear(),
  has: (name: string) => store.has(name),
  get: (name: string) => store.get(name),
  add: (faction: FactionData) => store.set(faction.sName, new Faction(faction)),
  set: (name: string, faction: FactionData) =>
    store.set(name, new Faction(faction)),
  remove: (name: string) => store.delete(name),

  getByName: (name: string) =>
    store.find((faction) => equalsIgnoreCase(faction.name, name)),
  findBy: (predicate: (value: Faction) => boolean) => store.find(predicate),
};
