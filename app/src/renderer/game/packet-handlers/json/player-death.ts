import type { Bot } from "@lib/Bot";

export function playerDeath(bot: Bot, packet: PlayerDeathPacket) {
    // Check if the death is for the local player by comparing userID
    const localPlayer = bot.world.players.get(bot.auth.username.toLowerCase());
    if (localPlayer && localPlayer.data.entID === packet.userID) {
        bot.player._setDead(true);
        bot.emit("playerDeath");
    }
}

export type PlayerDeathPacket = {
    cmd: "playerDeath";
    userID: number;
};
