import { Bot } from "~/lib/Bot";
import { client, handlers } from "~/shared/tipc";
import type { EnvironmentState } from "~/shared/types";

const bot = Bot.getInstance();

handlers.environment.stateChanged.listen((state: EnvironmentState) => {
  bot.environment.applyUpdate({
    questIds: state.questIds,
    questItemIds: state.questItemIds,
    itemNames: state.itemNames,
    boosts: state.boosts,
    rejectElse: state.rejectElse,
    autoRegisterRequirements: state.autoRegisterRequirements,
    autoRegisterRewards: state.autoRegisterRewards,
  });
});

handlers.environment.grabBoosts.handle(async () => {
  if (!bot.player.isReady()) return [];

  return bot.inventory.items
    .filter((item) => item.data.sType === "ServerUse")
    .map((item) => item.name);
});

handlers.environment.getState.handle(async () => client.environment.getState());
