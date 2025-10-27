import type { Bot } from "@lib/Bot";

const parseValue = (parts: string[], prefix: string) =>
  parts.find((part) => part.startsWith(prefix))?.split(":")[1];

export function strUotls(bot: Bot, args: string[]) {
  const playerName = args[2];
  const player = bot.world.players.get(playerName!);

  if (!player) {
    return;
  }

  const parts = args[args.length - 1]?.split(",");

  // Player move
  if (parts?.[0]?.startsWith("sp:")) {
    const tx = Number(parseValue(parts!, "tx:"));
    const ty = Number(parseValue(parts!, "ty:"));

    player.xPos = tx;
    player.yPos = ty;
    player.data.strFrame = parseValue(parts!, "strFrame:") ?? "Enter";
  }

  // Player afk
  if (parts?.[0] === "afk:true") {
    if (bot.auth.username.toLowerCase() === playerName!.toLowerCase())
      bot.emit("afk");
    else bot.emit("afk", playerName!);
  }
}
