import { Layer } from "effect";
import { BridgeLive } from "./Bridge";
import { PacketLive } from "./Packet";
import { PacketRouterLive } from "./PacketRouter";
import { PlayerLive } from "./Player";

export const FlashLive = Layer.mergeAll(
  BridgeLive,
  PacketLive,
  PacketRouterLive,
  PlayerLive.pipe(Layer.provide(BridgeLive))
);