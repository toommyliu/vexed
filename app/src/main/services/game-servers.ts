import type { ServerData } from "@vexed/game";
import fetch from "node-fetch";
import { createLogger } from "./logger";

const SERVERS_API_URL = "https://game.aq.com/game/api/data/servers";
const logger = createLogger("services:game-servers");

const CACHE_TTL_MS = 5 * 60 * 1_000;

let servers: ServerData[] = [];
let lastFetchTime = 0;

export const gameServers = {
  async get(): Promise<ServerData[]> {
    const now = Date.now();
    if (servers.length > 0 && now - lastFetchTime < CACHE_TTL_MS)
      return servers;

    try {
      const resp = await fetch(SERVERS_API_URL);
      if (!resp.ok) {
        logger.error("Failed to fetch servers", {
          status: resp.status,
          statusText: resp.statusText,
        });
        return servers;
      }

      const data = await resp.json();
      if (!Array.isArray(data)) {
        logger.error("Invalid servers payload", data);
        return servers;
      }

      // eslint-disable-next-line require-atomic-updates
      servers = data as ServerData[];
      // eslint-disable-next-line require-atomic-updates
      lastFetchTime = Date.now();
      return servers;
    } catch (error) {
      logger.error("Failed to fetch servers", error);
      return servers;
    }
  },

  async update() {
    lastFetchTime = 0;
    return this.get();
  },
};
