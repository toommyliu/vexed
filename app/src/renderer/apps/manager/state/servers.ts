import type { ServerData } from "@vexed/game";
import { SvelteMap } from "svelte/reactivity";
import { writable } from "svelte/store";

export const servers = new SvelteMap<string, ServerData>();

export const selectedServer = writable("");
