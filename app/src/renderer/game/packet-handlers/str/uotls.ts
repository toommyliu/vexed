import { equalsIgnoreCase } from "@vexed/utils";
import { registerStrHandler } from "../registry";

registerStrHandler("uotls", (bot, packet) => {
  const data = packet[3] ?? "";
  const parts = data.split(",");
  const get = (prefix: string) =>
    parts.find((part) => part.startsWith(prefix))?.split(":")[1] ?? null;

  // player afk
  if (packet.length === 4 && data.startsWith("afk:")) {
    const afkValue = get("afk:");
    const afkOn = afkValue === "true";
    const name = packet[2]?.toLowerCase();

    // TODO: remove this
    // backward compatibility
    if (afkOn && equalsIgnoreCase(name, bot.auth.username)) bot.emit("afk");

    const player = bot.world.players.getByName(packet[2]!);
    if (!player) return;

    player.data.afk = afkOn;
  }

  // TODO: incorporate Follower Copy Walk here

  // (remote) player move
  if (packet.length === 4 && data.startsWith("sp:")) {
    const name = packet[2]?.toLowerCase() ?? "";
    const player = bot.world.players.getByName(name);
    if (!player) return;

    const tx = Number(get("tx:"));
    const ty = Number(get("ty:"));
    const cell = get("strFrame:");

    if (Number.isFinite(tx)) player.data.tx = tx;
    if (Number.isFinite(ty)) player.data.ty = ty;
    if (typeof cell === "string") player.data.strFrame = cell;
  }

  // (remote) player cell change
  // mvts:-1,px:500,py:375,strPad:Top,bResting:false,mvtd:0,tx:0,ty:0,strFrame:r1

  if (packet.length === 4 && data.startsWith("mvts:")) {
    const name = packet[2]?.toLowerCase() ?? "";
    const player = bot.world.players.getByName(name);
    if (!player) return;

    const tx = Number(get("px:"));
    const ty = Number(get("py:"));
    const cell = get("strFrame:");
    const pad = get("strPad:");

    // these position values seem incorrect...
    if (Number.isFinite(tx)) player.data.tx = tx;
    if (Number.isFinite(ty)) player.data.ty = ty;
    if (typeof cell === "string") player.data.strFrame = cell;
    if (typeof pad === "string") player.data.strPad = pad;

    console.log(`uotls :: ${name} moved to ${tx}:${ty} in ${cell} (${pad})`);
  }
});
