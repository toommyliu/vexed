import { Effect, Layer } from "effect";
import { AuthLive } from "./Auth";
import { AutoZoneLive } from "./AutoZone";
import { BankLive } from "./Bank";
import { BridgeLive } from "./Bridge";
import { CombatLive } from "./Combat";
import { DropsLive } from "./Drops";
import { InventoryLive } from "./Inventory";
import { PacketLive } from "./Packet";
import { PacketDomainLive } from "./PacketDomain";
import { PlayerLive } from "./Player";
import { QuestsLive } from "./Quests";
import { SettingsLive } from "./Settings";
import { ShopsLive } from "./Shops";
import { TempInventoryLive } from "./TempInventory";
import { WorldLive } from "./World";

const BridgeCoreLive = BridgeLive;
const PacketRuntimeLive = PacketLive;

const AuthRuntimeLive = AuthLive.pipe(Layer.provide(BridgeCoreLive));
const WorldRuntimeLive = WorldLive.pipe(Layer.provide(BridgeCoreLive));

const CoreRuntimeLive = Layer.mergeAll(
  BridgeCoreLive,
  PacketRuntimeLive,
  AuthRuntimeLive,
  WorldRuntimeLive,
);

const DomainRuntimeLive = Layer.mergeAll(
  PlayerLive,
  SettingsLive,
  ShopsLive,
  BankLive,
  DropsLive,
  InventoryLive,
  TempInventoryLive,
  PacketDomainLive,
  QuestsLive,
).pipe(Layer.provide(CoreRuntimeLive));

const FeatureRuntimeLive = Layer.mergeAll(CombatLive, AutoZoneLive).pipe(
  Layer.provide(Layer.mergeAll(CoreRuntimeLive, DomainRuntimeLive)),
);

export const FlashLive = Layer.mergeAll(
  CoreRuntimeLive,
  DomainRuntimeLive,
  FeatureRuntimeLive,
).pipe(
  Layer.tapCause((cause) =>
    Effect.logError({
      message: "failed to compose flash service layer",
      cause,
    }),
  ),
);
