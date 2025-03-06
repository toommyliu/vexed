import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();

export async function exitFromCombat() {
  const ogProvokeMap = bot.settings.provokeMap;
  const ogProvokeCell = bot.settings.provokeCell;

  bot.settings.provokeMap = false;
  bot.settings.provokeCell = false;

  let success = false;

  if (bot.player.isInCombat()) {
    // logger.info('in combat, trying to exit');

    // immediately try to escape with current cell
    await bot.world.jump(bot.player.cell, bot.player.pad);
    await bot.sleep(1_000);

    // if we are still in combat, try to escape to another cell
    if (bot.player.isInCombat()) {
      const ogCell = bot.player.cell;

      for (const cell of bot.world.cells) {
        if (cell === ogCell) continue;

        await bot.world.jump(cell);

        await bot.waitUntil(() => !bot.player.isInCombat(), null, 3);

        if (!bot.player.isInCombat()) {
          success = true;
          break;
        }
      }

      // we didn't escape
      success = false;
    }
  }

  await bot.sleep(1_000);

  // eslint-disable-next-line require-atomic-updates
  bot.settings.provokeMap = ogProvokeMap;
  // eslint-disable-next-line require-atomic-updates
  bot.settings.provokeCell = ogProvokeCell;

  return success;
}
