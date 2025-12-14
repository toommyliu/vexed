import type { Bot } from "@lib/Bot";

export function playerDeath(bot: Bot, packet: PlayerDeathPacket) {
    // Find the player who died by their userID
    const deadPlayer = bot.world.players.find(
        (p) => p.data.entID === packet.userID,
    );

    if (!deadPlayer) return;

    const playerName = deadPlayer.data.uoName;

    // If it's the local player, update their death state
    const isLocalPlayer =
        playerName.toLowerCase() === bot.auth.username?.toLowerCase();
    if (isLocalPlayer) {
        bot.player._setDead(true);
    }

    // Emit for all player deaths with the player name
    bot.emit("playerDeath", playerName);
}

export type PlayerDeathPacket = {
    cmd: "playerDeath";
    userID: number;
};
