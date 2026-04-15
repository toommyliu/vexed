import type { ServerData } from "@vexed/game";

export type LoginInfo = {
  servers: ServerData[];
  bSuccess: number;
  iUpg: number;
  unm: string; // username
  sToken: string; // password
};

export type BaseTargetInfo = {
  type: "player" | "monster";
  intHP: number;
  intHPMax: number;
  intState: number;
  strFrame: string;
};

export type MonsterTargetInfo = BaseTargetInfo & {
  type: "monster";
  MonID: number;
  MonMapID: number;
  iLvl: number;
  sRace: string;
  strMonName: string;
};

export type PlayerTargetInfo = BaseTargetInfo & {
  type: "player";
  strName: string;
};

export type TargetInfo = MonsterTargetInfo | PlayerTargetInfo;
