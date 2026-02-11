// eslint-disable-next-line import-x/no-duplicates
import { SvelteMap } from "svelte/reactivity";
import type { SkillSet } from "../util/skillParser";
// eslint-disable-next-line import-x/no-duplicates
import { writable } from "svelte/store";

export const gameLoaded = writable(false);

let skillSets = new SvelteMap<string, SkillSet>();

export const appState = {
  get skillSets() {
    return skillSets;
  },
  set skillSets(value) {
    skillSets = value;
  },
};
