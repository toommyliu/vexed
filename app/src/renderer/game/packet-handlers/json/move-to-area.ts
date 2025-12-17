import { AuraCache } from "~/lib/cache/AuraCache";
import type { JsonPacketHandler } from "../types";

type MoveToAreaData = {
  areaId: number;
  areaName: string;
  cmd: string;
  intType: string;
  monBranch: unknown[];
  sExtra: string;
  strMapFileName: string;
  strMapName: string;
  uoBranch?: UoBranch[];
};

type UoBranch = {
  afk: boolean;
  entID: number;
  entType: string;
  intHP: number;
  intHPMax: number;
  intLevel: number;
  intMP: number;
  intMPMax: number;
  intState: number;
  showCloak: boolean;
  showHelm: boolean;
  strFrame: string;
  strPad: string;
  strUsername: string;
  tx: number;
  ty: number;
  uoName: string;
};

export default {
  cmd: "moveToArea",
  type: "json",
  run: async (bot, data) => {
    AuraCache.clear();

    for (const user of data.uoBranch ?? []) {
      if (user.strUsername.toLowerCase() === bot.auth.username.toLowerCase())
        continue;

      AuraCache.registerPlayer(user.strUsername, user.entID);
    }

    bot.emit("mapChanged", data.areaName);
  },
} satisfies JsonPacketHandler<MoveToAreaData>;
