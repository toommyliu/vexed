import type { ServerData } from "@vexed/game";
import { SvelteMap } from "svelte/reactivity";

export const servers = new SvelteMap<string, ServerData>();
