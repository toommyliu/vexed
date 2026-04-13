import { Effect, Layer } from "effect";
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

const BridgeCoreLive = BridgeLive;

const AuthRuntimeLive = AuthLive.pipe(Layer.provide(BridgeCoreLive));

const BridgeWithAuthLive = Layer.mergeAll(BridgeCoreLive, AuthRuntimeLive);

const BridgeOnlyDomainsLive = Layer.mergeAll(
  CombatLive,
  PlayerLive,
  SettingsLive,
  ShopsLive
).pipe(Layer.provideMerge(WorldLive), Layer.provide(BridgeCoreLive));

const BridgeAuthDomainsLive = Layer.mergeAll(BankLive, DropsLive).pipe(
  Layer.provide(BridgeWithAuthLive),
);

const BridgeRuntimeLive = Layer.mergeAll(
  BridgeWithAuthLive,
  BridgeOnlyDomainsLive,
  BridgeAuthDomainsLive,
);

const PacketCoreLive = PacketLive;

const PacketRouterRuntimeLive = PacketRouterLive.pipe(
  Layer.provide(PacketCoreLive),
);

const PacketHandlerRuntimeLive = PacketHandlerLive.pipe(
  Layer.provide(PacketRouterRuntimeLive),
);

const PacketRuntimeLive = Layer.mergeAll(
  PacketCoreLive,
  PacketRouterRuntimeLive,
  PacketHandlerRuntimeLive,
);

const PacketDomainRuntimeLive = PacketDomainLive.pipe(
  Layer.provide(Layer.mergeAll(PacketHandlerRuntimeLive, BridgeRuntimeLive)),
);

const QuestsRuntimeLive = QuestsLive.pipe(
  Layer.provide(Layer.mergeAll(BridgeRuntimeLive, PacketRuntimeLive)),
);

const FlashDomainLive = Layer.mergeAll(
  BridgeRuntimeLive,
  PacketRuntimeLive,
  PacketDomainRuntimeLive,
  QuestsRuntimeLive,
);

const AutoZoneRuntimeLive = AutoZoneLive.pipe(
  Layer.provide(FlashDomainLive),
);

export const FlashLive = Layer.mergeAll(FlashDomainLive, AutoZoneRuntimeLive).pipe(
  Layer.tapCause((cause) =>
    Effect.logError({
      message: "failed to compose flash service layer",
      cause,
    }),
  ),
);
