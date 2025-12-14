import type { Bot } from "../lib/Bot";
import { AuraStore } from "../lib/util/AuraStore";

export async function moveToArea(bot: Bot, packet: Packet) {
  AuraStore.clear();

  for (const user of packet.uoBranch ?? []) {
    if (user.strUsername.toLowerCase() === bot.auth.username.toLowerCase()) continue;
    AuraStore.registerPlayer(user.strUsername, user.entID);
  }

  bot.emit("mapChanged", packet.areaName);
}

type Packet = {
  areaId: number;
  areaName: string; // buyhouse-12345
  cmd: string; // moveToArea
  intType: string;
  monBranch: any[];
  sExtra: string;
  strMapFileName: string;
  strMapName: string; // buyhouse
  uoBranch: UoBranch[];
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
