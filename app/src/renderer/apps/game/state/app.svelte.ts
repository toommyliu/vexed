import { SvelteMap } from "svelte/reactivity";
import { writable } from "svelte/store";
import type { SkillSet } from "../util/skillParser";

export const appState = writable({
  gameLoaded: false,
  skillSets: new SvelteMap<string, SkillSet>(),
});
