import type { AvatarData, ServerData } from "@vexed/game";

// objLogin
export type LoginSessionPayload = {
  readonly servers?: ServerData[];
  readonly bSuccess?: number;
  readonly bCCOnly?: number;
  readonly iAccess?: number;
  readonly iAge?: number;
  readonly iEmailStatus?: number;
  readonly iUpg?: number;
  readonly iUpgDays?: number;
  readonly unm?: string; // username
  readonly sToken?: string; // password token
};

export type LoginSession = Omit<
  LoginSessionPayload,
  "bSuccess" | "iUpg" | "servers" | "sToken" | "unm"
> & {
  bSuccess: number;
  iUpg: number;
  servers: ServerData[];
  sToken: string;
  unm: string;
};

// loginInfo
export type LoginCredentials = {
  readonly strUsername: string;
  readonly strPassword: string;
  readonly strToken?: string;
};

export type ConnectToSelectionStatus =
  | "selected"
  | "not-ready"
  | "offline"
  | "full"
  | "member-only"
  | "chat-restricted"
  | "underage-chat"
  | "email-unconfirmed"
  | "test-client-required"
  | "not-found";

export type ConnectToSelectionResult = {
  readonly status: ConnectToSelectionStatus;
  readonly message: string;
  readonly serverName?: string;
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

export type ConsumableSkillItem = {
  itemId?: number;
  name?: string;
};
