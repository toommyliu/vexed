import { Effect, Layer } from "effect";
import { AuthLive } from "./Auth";
import { BankLive } from "./Bank";
import { BridgeLive } from "./Bridge";
import { CombatLive } from "./Combat";
import { DropsLive } from "./Drops";
import { HouseLive } from "./House";
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
const PacketRuntimeLive = PacketLive.pipe(Layer.provide(BridgeCoreLive));

const AuthRuntimeLive = AuthLive.pipe(Layer.provide(BridgeCoreLive));
const WorldRuntimeLive = WorldLive.pipe(Layer.provide(BridgeCoreLive));

const CoreRuntimeLive = Layer.mergeAll(
  BridgeCoreLive,
  PacketRuntimeLive,
  AuthRuntimeLive,
  WorldRuntimeLive,
);

const PlayerRuntimeLive = PlayerLive.pipe(Layer.provideMerge(InventoryLive));

const DomainRuntimeLive = Layer.mergeAll(
  PlayerRuntimeLive,
  SettingsLive,
  ShopsLive,
  BankLive,
  HouseLive,
  DropsLive,
  TempInventoryLive,
  PacketDomainLive,
  QuestsLive,
).pipe(Layer.provide(CoreRuntimeLive));

const CombatRuntimeLive = CombatLive.pipe(
  Layer.provide(Layer.mergeAll(CoreRuntimeLive, DomainRuntimeLive)),
);

export const FlashLive = Layer.mergeAll(
  CoreRuntimeLive,
  DomainRuntimeLive,
  CombatRuntimeLive,
).pipe(
  Layer.tapCause((cause) =>
    Effect.logError({
      message: "failed to compose flash service layer",
      cause,
    }),
  ),
);
