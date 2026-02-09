import { SvelteMap } from "svelte/reactivity";
import type { SkillSet } from "../util/skillParser";

let _gameLoaded = $state(false);
let skillSets = new SvelteMap<string, SkillSet>();

export const appState = {
  get gameLoaded() {
    return _gameLoaded;
  },
  set gameLoaded(value) {
    _gameLoaded = value;
  },
  get skillSets() {
    return skillSets;
  },
  set skillSets(value) {
    skillSets = value;
  },
};
