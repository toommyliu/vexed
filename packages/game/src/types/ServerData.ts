import { Schema } from "effect";

export const ServerDataSchema = Schema.Struct({
  bOnline: Schema.Number,
  bUpg: Schema.Number,
  iChat: Schema.Number,
  iCount: Schema.Number,
  iLevel: Schema.Number,
  iMax: Schema.Number,
  iPort: Schema.Number,
  sIP: Schema.String,
  sLang: Schema.String,
  sName: Schema.String,
});

export type ServerData = Schema.Schema.Type<typeof ServerDataSchema>;
