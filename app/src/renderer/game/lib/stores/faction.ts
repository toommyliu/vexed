import { Collection } from "@vexed/collection";
import { Faction, type FactionData } from "@vexed/game";
import type { Store } from "./store";

const store = new Collection<string, Faction>();

export const factions: Store<string, Faction, FactionData> = {
  all: () => store,
  has: (name: string) => store.has(name),
  get: (name: string) => store.get(name),
  add: (faction: FactionData) => store.set(faction.sName, new Faction(faction)),
  remove: (name: string) => store.delete(name),

  getByName: (name: string) => store.get(name),
  getById: (id: number) => store.find((faction) => faction.id === id),
  findBy: (predicate: (value: Faction) => boolean) => store.find(predicate),
};
