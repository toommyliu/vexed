import type { WINDOW_IDS } from "../../common/constants";
import type { Context } from "./botting/context";
import type { cmd } from "./botting/index";
import type { Bot } from "./lib/Bot";
import type { ClientPacket } from "./lib/Packets";
import type { ShopInfo } from "./lib/Shops";
import type { GameAction } from "./lib/World";
import type { AvatarData } from "./lib/models/Avatar";
import type { FactionData } from "./lib/models/Faction";
import type { ItemData } from "./lib/models/Item";
import type { MonsterData } from "./lib/models/Monster";
import type { QuestData } from "./lib/models/Quest";
import type { ServerData } from "./lib/models/Server";
import type { Logger } from "./util/logger";

type Nullable<T> = T | null;
declare global {
  const swf: GameSWF;

  interface Window {
    swf: GameSWF;
  }

  type WindowId = (typeof WINDOW_IDS)[keyof typeof WINDOW_IDS];
  type IpcChannelEvent = (typeof IPC_EVENTS)[keyof typeof IPC_EVENTS];

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

    authIsLoggedIn(): boolean;
    authIsTemporarilyKicked(): boolean;
    authLogin(username: string, password: string): void;
    authLogout(): void;
    authGetServers(): ServerData[];
    authConnectTo(server: string): void;

    bankGetItems(): ItemData[];
    bankGetItem(key: number | string): ItemData | null;
    bankContains(key: number | string, quantity?: number): boolean;
    bankLoadItems(): void;
    bankGetSlots(): number;
    bankGetUsedSlots(): number;
    bankDeposit(key: number | string): boolean;
    bankWithdraw(key: number | string): boolean;
    bankSwap(invKey: number | string, bankKey: number | string): boolean;
    bankOpen(): void;
    bankIsOpen(): boolean;

    combatHasTarget(): boolean;
    combatGetTarget(): Record<string, unknown> | null;
    combatUseSkill(index: number): void;
    combatForceUseSkill(index: number): void;
    combatCanUseSkill(index: number): boolean;
    combatGetSkillCooldownRemaining(index: number): number;
    combatCancelAutoAttack(): void;
    combatCancelTarget(): void;
    combatAttackMonster(name: string): void;
    combatAttackMonsterById(monMapId: number): void;

    dropStackAcceptDrop(itemId: number): void;
    dropStackRejectDrop(itemName: string, itemId: string): void;
    dropStackIsUsingCustomDrops(): boolean;
    dropStackSetCustomDropsUiState(on: boolean, draggable: boolean): void;
    dropStackIsCustomDropsUiOpen(): boolean;
    dropStackSetCustomDropsUiOpen(on: boolean): void;

    houseGetItems(): ItemData[];
    houseGetItem(key: number | string): Nullable<ItemData>;
    houseContains(key: number | string, quantity: number | undefined): boolean;
    houseGetSlots(): number;

    inventoryGetItems(): ItemData[];
    inventoryGetItem(key: number | string): Nullable<ItemData>;
    inventoryContains(
      key: number | string,
      quantity: number | undefined,
    ): boolean;
    inventoryGetSlots(): number;
    inventoryGetUsedSlots(): number;
    inventoryEquip(key: number | string): boolean;

    playerJoinMap(map: string, cell: string | null, pad: string | null): void;
    playerGetMap(): string;
    playerJump(cell: string, pad: string | null): void;
    playerGetCell(): string;
    playerGetPad(): string;
    playerGetFactions(): FactionData[];
    playerGetState(): number;
    playerGetHp(): number;
    playerGetMaxHp(): number;
    playerGetMp(): number;
    playerGetMaxMp(): number;
    playerGetLevel(): number;
    playerGetGold(): number;
    playerIsMember(): boolean;
    playerIsAfk(): boolean;
    playerGetPosition(): [number, number];
    playerWalkTo(x: number, y: number, walkSpeed?: number): void;
    playerRest(): void;
    playerUseBoost(itemId: number): boolean;
    playerHasActiveBoost(boost: string): boolean;
    playerGetClassName(): string;
    playerGetUserId(): number;
    playerGetCharId(): number;
    playerGetGender(): string;
    playerGetData(): Record<string, unknown>;
    playerIsLoaded(): boolean;
    playerGoTo(name: string): void;

    questsIsInProgress(questId: number): boolean;
    questsComplete(
      questId: number,
      turnIns?: number,
      itemId?: number,
      special?: boolean,
    ): void;
    questsAccept(questId: number): void;
    questsLoad(questId: number): void;
    questsGet(questId: number): Nullable<Record<string, unknown>>;
    questsGetMultiple(questIds: string): void;
    questsGetTree(): QuestData[];
    questsGetQuestValidationString(quest: QuestData): string;
    questsHasRequiredItemsForQuest(quest: QuestData): boolean;
    questsIsAvailable(questId: number): boolean;
    questsCanCompleteQuest(questId: number): boolean;
    questsIsOneTimeQuestDone(questId: number): boolean;

    settingsInfiniteRange(): void;
    settingsProvokeMap(): void;
    settingsProvokeCell(): void;
    settingsEnemyMagnet(): void;
    settingsLagKiller(on: boolean): void;
    settingsSkipCutscenes(): void;
    settingsSetName(name: string): void;
    settingsSetGuild(name: string): void;
    settingsSetWalkSpeed(speed: number): void;
    settingsSetAccessLevel(
      accessLevel:
        | "30"
        | "40"
        | "50"
        | "60"
        | "Member"
        | "Moderator"
        | "Non Member",
    );
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

    tempInventoryGetItems(): ItemData[];
    tempInventoryGetItem(key: number | string): Nullable<ItemData>;
    tempInventoryContains(key: number | string, quantity?: number): boolean;

    worldIsLoaded(): boolean;
    worldGetPlayerNames(): string[];
    worldGetPlayers(): string;
    worldGetPlayer(name: string): string;
    worldIsPlayerInCell(name: string, cell?: string): boolean;
    worldIsActionAvailable(
      gameAction: (typeof GameAction)[keyof typeof GameAction],
    ): boolean;
    worldGetCellMonsters(): MonsterData[];
    worldGetMonsterByName(key: string | "*"): Nullable<MonsterData>;
    worldGetMonsterByMonMapId(key: number): Nullable<MonsterData>;
    worldIsMonsterAvailable(key: number | string | "*"): boolean;
    worldGetCells(): string[];
    worldGetCellPads(): string[];
    worldGetItemTree(): ItemData[];
    worldGetRoomId(): number;
    worldGetRoomNumber(): number;
    worldReload(): void;
    worldLoadSwf(swf: string): void;
    worldGetMapItem(itemId: number): void;
    worldSetSpawnPoint(cell?: string, pad?: string): void;

    isChatFocused(): boolean;
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
    context: Context;
    /* eslint-enable typescript-sort-keys/interface */
  }
}

export {};
