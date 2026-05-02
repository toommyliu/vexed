import type { AvatarData, ServerData } from "@vexed/game";

export type LoginResponse = {
  servers: ServerData[];
  bSuccess: number;
  iUpg: number;
  unm: string; // username
  sToken: string; // password
};

export type LoginCredentials = {
  strUsername: string;
  strPassword: string;
  strToken: string;
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

export type PlayerTargetInfo = AvatarData & {
  type: "player";
  intSP: number;
};

export type TargetInfo = MonsterTargetInfo | PlayerTargetInfo;

export type ActiveSkillItem = {
  itemId?: number;
  name?: string;
};
