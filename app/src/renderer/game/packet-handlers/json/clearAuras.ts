import type { Bot } from "@lib/Bot";
import { AuraStore } from "@lib/util/AuraStore";

export function clearAuras(bot: Bot, _: ClearAurasPkt) {
  AuraStore.clearPlayerAuras(bot.auth.username.toLowerCase());
}

export type ClearAurasPkt = {
  cmd: "clearAuras";
};