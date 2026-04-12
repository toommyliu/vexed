import { Layer } from "effect";
import { AuthLive } from "./Auth";
import { AutoZoneLive } from "./AutoZone";
import { BankLive } from "./Bank";
import { BridgeLive } from "./Bridge";
import { CombatLive } from "./Combat";
import { DropsLive } from "./Drops";
import { PacketDomainLive } from "./PacketDomain";
import { PacketHandlerLive } from "./PacketHandler";
import { PacketLive } from "./Packet";
import { PacketRouterLive } from "./PacketRouter";
import { PlayerLive } from "./Player";
import { QuestsLive } from "./Quests";
import { SettingsLive } from "./Settings";
import { ShopsLive } from "./Shops";
import { WorldLive } from "./World";
import { WorldStateLive } from "./WorldState";

const FlashCoreLive = Layer.mergeAll(BridgeLive, PacketLive);

const PacketRuntimeLive = Layer.mergeAll(
  FlashCoreLive,
  PacketRouterLive.pipe(Layer.provide(FlashCoreLive)),
);

const BridgeDomainLive = Layer.mergeAll(
  BankLive.pipe(Layer.provide(BridgeLive)),
  CombatLive.pipe(Layer.provide(BridgeLive)),
  DropsLive.pipe(Layer.provide(BridgeLive)),
  PlayerLive.pipe(Layer.provide(BridgeLive)),
  QuestsLive.pipe(Layer.provide(BridgeLive)),
  SettingsLive.pipe(Layer.provide(BridgeLive)),
  ShopsLive.pipe(Layer.provide(BridgeLive)),
  WorldLive.pipe(Layer.provide(BridgeLive)),
  WorldStateLive.pipe(Layer.provide(BridgeLive)),
).pipe(Layer.provideMerge(AuthLive.pipe(Layer.provide(BridgeLive))));

const PacketHandlerRuntimeLive = PacketHandlerLive.pipe(
  Layer.provideMerge(PacketRuntimeLive),
);

const FlashDomainLive = PacketDomainLive.pipe(
  Layer.provideMerge(PacketHandlerRuntimeLive),
  Layer.provideMerge(BridgeDomainLive),
);

export const FlashLive = AutoZoneLive.pipe(
  Layer.provideMerge(FlashDomainLive),
);
