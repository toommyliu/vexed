import { equalsIgnoreCase } from "@vexed/utils";
import { get } from "svelte/store";
import { followerConfig } from "../../state/follower";
import { registerStrHandler } from "../registry";

registerStrHandler("uotls", (bot, packet) => {
  const data = packet[3] ?? "";
  const parts = data.split(",");
  const getPartValue = (prefix: string) =>
    parts.find((part) => part.startsWith(prefix))?.split(":")[1] ?? null;

  // player afk
  if (packet.length === 4 && data.startsWith("afk:")) {
    const afkValue = getPartValue("afk:");
    const afkOn = afkValue === "true";
    const name = packet[2]?.toLowerCase();

    // TODO: remove this

    // backward compatibility
    if (afkOn && equalsIgnoreCase(name, bot.auth.username)) bot.emit("afk");

    const player = bot.world.players.getByName(packet[2]!);
    if (!player) return;

    player.data.afk = afkOn;
  }

  // (remote) player move
  if (packet.length === 4 && data.startsWith("sp:")) {
    const name = packet[2]?.toLowerCase() ?? "";
    const player = bot.world.players.getByName(name);
    if (!player) return;

    const tx = Number(getPartValue("tx:"));
    const ty = Number(getPartValue("ty:"));
    const cell = getPartValue("strFrame:");
    const speed = Number(getPartValue("sp:")) ?? 8;

    if (Number.isFinite(tx)) player.data.tx = tx;
    if (Number.isFinite(ty)) player.data.ty = ty;
    if (typeof cell === "string") player.data.strFrame = cell;

    const followerCfg = get(followerConfig);
    if (followerCfg?.copyWalk && equalsIgnoreCase(name, followerCfg?.name))
      bot.player.walkTo(tx, ty, speed);
  }

  // (remote) player cell change
  if (packet.length === 4 && data.startsWith("mvts:")) {
    const name = packet[2]?.toLowerCase() ?? "";
    const player = bot.world.players.getByName(name);
    if (!player) return;

    const tx = Number(getPartValue("px:"));
    const ty = Number(getPartValue("py:"));
    const cell = getPartValue("strFrame:");
    const pad = getPartValue("strPad:");

    if (typeof cell === "string") player.data.strFrame = cell;
    if (typeof pad === "string") player.data.strPad = pad;

    // these position values seem incorrect...
    if (Number.isFinite(tx)) player.data.tx = tx;
    if (Number.isFinite(ty)) player.data.ty = ty;

    // console.log(`uotls :: ${name} moved to ${tx}:${ty} in ${cell} (${pad})`);
  }
});
