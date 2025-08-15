import { Bot } from "@lib/Bot";
import { handlers } from "@shared/tipc";

const bot = Bot.getInstance();

handlers.fastTravels.doFastTravel.handle(async ({ location }) => {
  if (!bot.player.isReady()) return;

  await bot.world.join(
    `${location.map}-${location.roomNumber}`,
    location.cell,
    location.pad,
  );
});
