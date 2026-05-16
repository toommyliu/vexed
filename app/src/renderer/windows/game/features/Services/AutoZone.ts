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

export const AUTO_ZONE_MAP_OPTIONS = [
  { value: "ledgermayne", label: "Ledgermayne" },
  { value: "moreskulls", label: "More Skulls" },
  { value: "ultradage", label: "Ultra Dage" },
  { value: "darkcarnax", label: "Dark Carnax" },
  { value: "astralshrine", label: "Astral Shrine" },
  { value: "queeniona", label: "Queen Iona" },
  { value: "magnumopus", label: "Magnum Opus" },
] as const satisfies readonly {
  readonly value: AutoZoneSupportedMap;
  readonly label: string;
}[];

export interface AutoZoneState {
  readonly enabled: boolean;
  readonly map: AutoZoneSupportedMap | undefined;
}

export type AutoZoneStateDisposer = () => void;

export type AutoZoneStateListener = (state: AutoZoneState) => void;

export interface AutoZoneStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface AutoZoneShape {
  readonly getState: () => Effect.Effect<AutoZoneState>;
  readonly isEnabled: () => Effect.Effect<boolean>;
  readonly getMap: () => Effect.Effect<AutoZoneSupportedMap | undefined>;
  readonly onState: (
    listener: AutoZoneStateListener,
    options?: AutoZoneStateSubscriptionOptions,
  ) => Effect.Effect<AutoZoneStateDisposer>;
  readonly setMap: (
    map: AutoZoneSupportedMap | undefined,
  ) => Effect.Effect<void>;
  readonly setEnabled: (enabled: boolean) => Effect.Effect<void>;
}

export class AutoZone extends ServiceMap.Service<AutoZone, AutoZoneShape>()(
  "features/Services/AutoZone",
) {}
