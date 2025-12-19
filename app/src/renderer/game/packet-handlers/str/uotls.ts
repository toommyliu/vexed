import type { StrPacketHandler } from "../types";

export default {
  cmd: "uotls",
  type: "str",
  run: (bot, data) => {
    if (
      data.length === 4 &&
      data[2]?.toLowerCase() === bot.auth?.username?.toLowerCase() &&
      data[3] === "afk:true"
    ) {
      bot.emit("afk");
    }
  },
} satisfies StrPacketHandler;
