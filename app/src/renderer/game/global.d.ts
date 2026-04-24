// Item id or name
type ItemIdentifierToken = number | string;
type ConnectionStatus = "OnConnection" | "OnConnectionLost";

type MonsterName =
  | string
  | `id'${number}`
  | `id.${number}`
  | `id:${number}`
  | `id-${number}`;
type MonsterMapID = number;
type MonsterIdentifierToken = MonsterName | MonsterMapID;
type Skill = number | string;
