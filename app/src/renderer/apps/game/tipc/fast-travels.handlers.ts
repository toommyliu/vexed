import { handlers } from "~/shared/tipc";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();

handlers.fastTravels.warp.handle(async ({ location }): Promise<void> => {
  if (!bot.player.isReady()) return;

  await bot.world.join(
    `${location.map}-${location.roomNumber}`,
    location.cell,
    location.pad,
  );
});
