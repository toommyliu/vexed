import { ServerDataSchema, type AvatarData } from "@vexed/game";
import { Schema } from "effect";

// objLogin
export const LoginSessionSchema = Schema.Struct({
  servers: Schema.mutable(Schema.Array(ServerDataSchema)),
  bSuccess: Schema.Number,
  bCCOnly: Schema.optionalKey(Schema.Number),
  iAccess: Schema.optionalKey(Schema.Number),
  iAge: Schema.optionalKey(Schema.Number),
  iEmailStatus: Schema.optionalKey(Schema.Number),
  iUpg: Schema.Number,
  iUpgDays: Schema.optionalKey(Schema.Number),
  unm: Schema.String, // username
  sToken: Schema.String, // password
});

export const LoginSessionFromJsonString =
  Schema.fromJsonString(LoginSessionSchema);

export type LoginSession = Schema.Schema.Type<typeof LoginSessionSchema>;

// loginInfo
export const LoginCredentialsSchema = Schema.Struct({
  strUsername: Schema.String,
  strPassword: Schema.String,
  strToken: Schema.String,
});

export const LoginCredentialsFromJsonString = Schema.fromJsonString(
  LoginCredentialsSchema,
);

export type LoginCredentials = Schema.Schema.Type<
  typeof LoginCredentialsSchema
>;

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
