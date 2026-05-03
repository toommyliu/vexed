import { ServiceMap, Schema, Effect } from "effect";

export const AutoZoneSupportedMap = Schema.Literals([
  "ledgermayne",
  "moreskulls",
  "ultradage",
  "darkcarnax",
  "astralshrine",
  "queeniona",
  "magnumopus",
]);
export type AutoZoneSupportedMap = Schema.Schema.Type<
  typeof AutoZoneSupportedMap
>;

export interface AutoZoneShape {
  readonly enabled: Effect.Effect<boolean>;
  readonly map: Effect.Effect<AutoZoneSupportedMap>;
  readonly setMap: (map: AutoZoneSupportedMap) => Effect.Effect<void>;
  readonly setEnabled: (enabled: boolean) => Effect.Effect<void>;
}

export class AutoZone extends ServiceMap.Service<AutoZone, AutoZoneShape>()(
  "features/Services/AutoZone",
) {}
