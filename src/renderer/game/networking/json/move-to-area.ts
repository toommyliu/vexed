import { Bot } from '../../lib/Bot';

export async function moveToArea(bot: Bot, _packet: unknown) {
  bot.flash.call(() => swf.settingsSetName(bot.settings.customName ?? ''));
  bot.flash.call(() => swf.settingsSetGuild(bot.settings.customGuild ?? ''));
}
