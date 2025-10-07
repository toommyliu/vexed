import type { Bot } from "@lib/Bot";

const parseValue = (parts: string[], prefix: string) =>
  parts.find((part) => part.startsWith(prefix))?.split(":")[1];

export function strUotls(bot: Bot, args: string[]) {
  // console.log("uotls packet", args);

  const plyrName = args[2];
  const player = bot.world.players.get(plyrName!);

  if (!player) {
    // console.log("uotls: player not found", plyrName);
    return;
  }

  const parts = args[args.length - 1]?.split(",");
  // console.log("uotls parts", parts);

  // player move
  if (parts?.[0]?.startsWith("sp:")) {
    const tx = Number(parseValue(parts!, "tx:"));
    const ty = Number(parseValue(parts!, "ty:"));

    player.xPos = tx;
    player.yPos = ty;
    player.data.strFrame = parseValue(parts!, "strFrame:") ?? "Enter";
  }

  // player afk
  if (parts?.[0] === "afk:true") {
    if (bot.auth.username.toLowerCase() === plyrName!.toLowerCase())
      bot.emit("afk");
    else bot.emit("afk", plyrName!);
  }
}
