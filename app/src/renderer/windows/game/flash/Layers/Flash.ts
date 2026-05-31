import { Effect, Layer } from "effect";
import { AuthLive } from "./Auth";
import { BankLive } from "./Bank";
import { BridgeLive } from "./Bridge";
import { CombatLive } from "./Combat";
import { DropsLive } from "./Drops";
import { HouseLive } from "./House";
import { InventoryLive } from "./Inventory";
import { OutfitsLive } from "./Outfits";
import { PacketLive } from "./Packet";
import { GameEventProjectorLive } from "./GameEventProjector";
import { GameEventsLive } from "./GameEvents";
import { PlayerLive } from "./Player";
import { QuestsLive } from "./Quests";
import { SettingsLive } from "./Settings";
import { ShopsLive } from "./Shops";
import { TempInventoryLive } from "./TempInventory";
import { WaitLive } from "./Wait";
import { WorldLive } from "./World";

const BridgeCoreLive = BridgeLive;
const WaitRuntimeLive = WaitLive.pipe(Layer.provide(BridgeCoreLive));

const AuthRuntimeLive = AuthLive.pipe(
  Layer.provide(Layer.mergeAll(BridgeCoreLive, WaitRuntimeLive)),
);
const WorldRuntimeLive = WorldLive.pipe(
  Layer.provide(Layer.mergeAll(BridgeCoreLive, WaitRuntimeLive)),
);
const PacketRuntimeLive = PacketLive.pipe(
  Layer.provide(
    Layer.mergeAll(BridgeCoreLive, AuthRuntimeLive, WorldRuntimeLive),
  ),
);

const CoreRuntimeLive = Layer.mergeAll(
  BridgeCoreLive,
  WaitRuntimeLive,
  PacketRuntimeLive,
  AuthRuntimeLive,
  WorldRuntimeLive,
  GameEventsLive,
);

const PlayerRuntimeLive = PlayerLive.pipe(Layer.provideMerge(InventoryLive));

const DomainRuntimeLive = Layer.mergeAll(
  PlayerRuntimeLive,
  SettingsLive,
  ShopsLive,
  BankLive,
  HouseLive,
  DropsLive,
  OutfitsLive,
  TempInventoryLive,
  GameEventProjectorLive,
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
