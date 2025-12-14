import type { Bot } from "../../lib/Bot";
import type { AvatarData } from "../../lib/models/Avatar";

export async function moveToArea(bot: Bot, packet: MoveToAreaPacket) {
  bot.world._moveToArea(packet);

  // Update player cell/pad and position from uoBranch
  const localPlayerData = packet.uoBranch.find(
    (p) => p.uoName.toLowerCase() === bot.auth.username.toLowerCase(),
  );
  if (localPlayerData) {
    bot.player._setLocation(localPlayerData.strFrame, localPlayerData.strPad ?? "Spawn");
  }

  // Get the Avatar from world.players and extract position
  const localAvatar = bot.world.players.get(bot.auth.username);
  if (localAvatar) {
    const x = localAvatar.xPos ?? Number(localPlayerData?.px ?? 0);
    const y = localAvatar.yPos ?? Number(localPlayerData?.py ?? 0);
    bot.player._setPosition(x, y);
  }

  bot.emit("mapChanged", packet.areaName);
  bot.emit("moveToArea", packet);
}

export type MoveToAreaPacket = {
  areaId: number;
  areaName: string; // buyhouse-12345
  cmd: string; // moveToArea
  intType: string;
  monBranch: {
    MonID: string;
    MonMapID: number;
    bRed: string;
    iLvl: number;
    intHP: number;
    intHPMax: number;
    intMP: number;
    intMPMax: number;
    intState: number;
  }[];
  mondef: {
    MonID: string;
    intLevel: number;
    sRace: string;
    strBehave: string;
    strLinkage: string;
    strMonFileName: string;
    strMonName: string;
  }[];
  monmap: {
    MonID: string;
    MonMapID: string;
    bRed: string;
    intRSS: string;
    strFrame: string;
  }[];
  sExtra: string;
  strMapFileName: string;
  strMapName: string; // buyhouse
  uoBranch: AvatarData[];
};
