import { Effect, Layer } from "effect";
import { AuthLive } from "./Auth";
import { AutoZoneLive } from "./AutoZone";
import { BankLive } from "./Bank";
import { BridgeLive } from "./Bridge";
import { CombatLive } from "./Combat";
import { DropsLive } from "./Drops";
import { PacketDomainLive } from "./PacketDomain";
import { PacketLive } from "./Packet";
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
  ShopsLive,
).pipe(Layer.provideMerge(WorldLive.pipe(Layer.provide(BridgeCoreLive))));

const PacketRuntimeLive = PacketLive;

const BridgeAuthDomainsLive = Layer.mergeAll(BankLive, DropsLive).pipe(
  Layer.provide(Layer.mergeAll(BridgeWithAuthLive, PacketRuntimeLive)),
);

const BridgeRuntimeLive = Layer.mergeAll(
  BridgeOnlyDomainsLive,
  BridgeAuthDomainsLive,
).pipe(Layer.provideMerge(BridgeWithAuthLive));

const PacketDomainRuntimeLive = PacketDomainLive.pipe(
  Layer.provide(Layer.mergeAll(PacketRuntimeLive, BridgeRuntimeLive)),
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

const AutoZoneRuntimeLive = AutoZoneLive.pipe(Layer.provide(FlashDomainLive));

export const FlashLive = Layer.mergeAll(
  FlashDomainLive,
  AutoZoneRuntimeLive,
).pipe(
  Layer.tapCause((cause) =>
    Effect.logError({
      message: "failed to compose flash service layer",
      cause,
    }),
  ),
);
