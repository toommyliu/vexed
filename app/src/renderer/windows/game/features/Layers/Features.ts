import { Layer } from "effect";
import { AutoAttackLive } from "./AutoAttack";
import { AutoReloginLive } from "./AutoRelogin";
import { AutoZoneLive } from "./AutoZone";

export const FeaturesLive = Layer.mergeAll(
  AutoAttackLive,
  AutoReloginLive,
  AutoZoneLive,
);
