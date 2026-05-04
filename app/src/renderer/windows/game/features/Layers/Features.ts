import { Layer } from "effect";
import { AutoReloginLive } from "./AutoRelogin";
import { AutoZoneLive } from "./AutoZone";

export const FeaturesLive = Layer.mergeAll(
  AutoReloginLive,
  AutoZoneLive,
);
