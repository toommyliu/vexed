import type { ServerData } from "@vexed/game";
import { writable } from "svelte/store";

export const servers = writable<ServerData[]>([]);
