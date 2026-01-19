import type { CommandExecutor } from "./botting/command-executor";
import type { cmd } from "./botting/index";
import type { Bot } from "./lib/core/Bot";
import type { ClientPacket } from "./lib/core/Packets";
import type { ShopInfo } from "./lib/core/Shops";
import type { GameAction } from "./lib/core/World";
import type { ItemData } from "./lib/models/Item";
import type { MonsterData } from "./lib/models/Monster";
import type { QuestData } from "./lib/models/Quest";
import type { ServerData } from "./lib/models/Server";

import type {
  AvatarData,
  FactionData,
  ItemData,
  MonsterData,
  QuestInfo,
  ServerData,
} from "@vexed/game";

// TODO: this needs a major update

type Nullable<T> = T | null;
declare global {
  const swf: GameSWF;

  interface Window {
    swf: GameSWF;
  }

  /* eslint-disable typescript-sort-keys/interface */
  type GameSWF = {
    getGameObject(path: string): string;
    getGameObjectS(path: string): string;
    setGameObject(path: string, value: unknown): void;
    getArrayObject(path: string, index: number): string;
    setArrayObject(path: string, index: number, value: unknown): void;
    callGameFunction(path: string, ...args: unknown[]): void;
    callGameFunction0(path: string): void;
    selectArrayObjects(path: string, selector: string): string;
    isNull(path: string): boolean;
    sendClientPacket(packet: string, type: ClientPacket): void;
    isConnMcBackButtonVisible(): boolean;
    getConnMcText(): string;

    // Auth
    authIsLoggedIn(): boolean;
    authIsTemporarilyKicked(): boolean;
    authLogin(username: string, password: string): void;
    authLogout(): void;
    authConnectTo(server: string): void;

    // Bank
    bankGetItem(key: number | string): ItemData | null;
    bankContains(key: number | string, quantity?: number): boolean;
    bankLoadItems(): void;
    bankDeposit(key: number | string): boolean;
    bankWithdraw(key: number | string): boolean;
    bankSwap(invKey: number | string, bankKey: number | string): boolean;

    // Combat
    combatHasTarget(): boolean;
    combatGetTarget(): Record<string, unknown> | null;
    combatUseSkill(index: number): void;
    combatForceUseSkill(index: number): void;
    combatGetSkillCooldownRemaining(index: number): number;
    combatCancelAutoAttack(): void;
    combatCancelTarget(): void;
    combatAttackMonster(name: string): void;
    combatAttackMonsterById(monMapId: number): void;

    dropStackAcceptDrop(itemId: number): void;
    dropStackRejectDrop(itemId: number): void;
    dropStackIsUsingCustomDrops(): boolean;
    dropStackGetDrops(): { [key: string]: number };
    dropStackGetItems(): { [key: number]: ItemData };
    dropStackToggleUi(): boolean;

    // House - done
    houseGetItem(key: number | string): Nullable<ItemData>;
    houseContains(key: number | string, quantity: number | undefined): boolean;
    houseGetSlots(): number;

    // Inventory - done
    inventoryGetItem(key: number | string): ItemData | null;
    inventoryContains(key: number | string, quantity?: number): boolean;

    // Player - done
    playerWalkTo(x: number, y: number, walkSpeed?: number): void;
    playerIsLoaded(): boolean;

    questsIsInProgress(questId: number): boolean;
    questsComplete(
      questId: number,
      turnIns?: number,
      itemId?: number,
      special?: boolean,
    ): void;
    questsAccept(questId: number): void;
    questsLoad(questId: number): void;
    questsAbandon(questId: number): void;
    questsGet(questId: number): Nullable<Record<string, unknown>>;
    questsGetMultiple(questIds: string): void;
    questsGetTree(): QuestData[];
    questsGetQuestValidationString(quest: QuestData): string;
    questsHasRequiredItemsForQuest(quest: QuestData): boolean;
    questsIsAvailable(questId: number): boolean;
    questsCanCompleteQuest(questId: number): boolean;
    questsIsOneTimeQuestDone(questId: number): boolean;

    settingsInfiniteRange(): void;
    settingsProvokeCell(): void;
    settingsEnemyMagnet(): void;
    settingsLagKiller(on: boolean): void;
    settingsSkipCutscenes(): void;
    settingsSetName(name: string): void;
    settingsSetGuild(name: string): void;
    settingsSetWalkSpeed(speed: number): void;
    settingsSetDeathAds(on: boolean): void;
    settingsSetDisableCollisions(on: boolean): void;
    settingsSetDisableFX(on: boolean): void;
    settingsSetHidePlayers(on: boolean): void;
    settingsSetFPS(fps: number): void;

    shopGetInfo(): Nullable<ShopInfo>;
    shopGetItems(): ItemData[];
    shopGetItem(key: number | string): Nullable<ItemData>;
    shopBuyByName(name: string, quantity?: number): boolean;
    shopBuyById(id: number | string, quantity?: number): boolean;
    shopSellByName(name: string, quantity?: number): boolean;
    shopSellById(id: number | string, quantity?: number): boolean;
    shopLoad(shopId: number): void;
    shopLoadHairShop(shopId: number): void;
    shopLoadArmorCustomize(): void;
    shopCanBuyItem(itemName: string): boolean;
    shopIsMergeShop(): boolean;

    // TempInventory - done
    tempInventoryGetItem(key: number | string): Nullable<ItemData>;
    tempInventoryContains(key: number | string, quantity?: number): boolean;

    // World
    worldIsLoaded(): boolean;
    worldIsActionAvailable(gameAction: string): boolean;
    worldGetCellMonsters(): MonsterData[];
    worldGetCells(): string[];
    worldGetCellPads(): string[];

    isTextFieldFocused(): boolean;
  };
  /* eslint-enable typescript-sort-keys/interface */

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    /* eslint-disable typescript-sort-keys/interface */
    // interop
    flashDebug(...args: string[]): void;
    packetFromClient(packet: [string]): Promise<void> | void;
    packetFromServer(packet: [string]): Promise<void> | void;
    loaded(): Promise<void> | void;
    connection(state: [string]): void;
    pext([packet]: [string]): Promise<void> | void;
    progress([percent]: [number]): void;

    swf: GameSWF;

    // other
    account?: AccountWithServer;

    // botting commands
    cmd: typeof cmd;
    context: CommandExecutor;
    /* eslint-enable typescript-sort-keys/interface */
  }
}

export {};
