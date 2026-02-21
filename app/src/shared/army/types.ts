export type ArmyConfigRaw = {
  PlayerCount?: number;
  RoomNumber?: number | string;
} & Partial<Record<`Player${number}`, string>> &
  Record<string, unknown>;

export type ArmyConfigPayload = {
  configName: string;
  leader: string;
  players: string[];
  raw: ArmyConfigRaw;
  roomNumber: string;
};
