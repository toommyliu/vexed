import { SvelteMap } from "svelte/reactivity";
import type { SkillSet } from "../util/skillParser";

let gameLoaded = $state(false);
let skillSets = new SvelteMap<string, SkillSet>();

export const appState = {
  get gameLoaded() {
    return gameLoaded;
  },
  set gameLoaded(value) {
    gameLoaded = value;
  },
  get skillSets() {
    return skillSets;
  },
  set skillSets(value) {
    skillSets = value;
  },
};
