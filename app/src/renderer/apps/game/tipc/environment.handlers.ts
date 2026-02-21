import type { EnvironmentState } from "~/shared/environment/types";
import { client, handlers } from "~/shared/tipc";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();

handlers.environment.stateChanged.listen((state: EnvironmentState) => {
  bot.environment.applyUpdate(state);
});

handlers.environment.grabBoosts.handle(async () => {
  if (!bot.player.isReady()) return [];
  return bot.inventory.items
    .filter((item) => item.data.sType === "ServerUse")
    .map((item) => item.name);
});

handlers.environment.getState.handle(async () => client.environment.getState());
