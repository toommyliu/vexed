
export interface KillOptions {
  /** An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma. */
  killPriority: string[] | string;
  /** Optional AbortSignal that can be used to abort the kill operation early. When the signal is aborted, the kill method will immediately stop and resolve. */
  signal?: AbortSignal;
  /** Custom skill action function that provides alternative combat logic. It should be implemented as a closure that returns an async function. When provided, this function replaces the default skill rotation logic. The outer and inner functions are bound with `bot` context. Skill logic should be implemented in the inner function. */
  skillAction: (() => () => Promise<void>) | null;
  /** The delay between each skill cast. */
  skillDelay: number;
  /** The order of skills to use. */
  skillSet: number[];
  /** Whether to wait for the skill to be available before casting. */
  skillWait: boolean;
}

/**
 * Base class for all commands.
 */
export class Command {
  /** Whether to skip the delay for this command */
  public skipDelay?: boolean;

  /**
   * The function that is called when the command is executed.
   *
   * This function has access to:
   * - "this.bot" - The bot instance.
   * - "this.ctx" - The scripting context environment (undocumented).
   * - "this.args" - The command arguments (only for custom commands).
   */
  declare execute: () => Promise<void> | void;

  declare toString: () => string;
}

export interface CommandConstructor {
  /**
   * Base class for all commands.
   */
  new (): Command;
}

declare const cmd: {
  /** Equips a set from the army config file. */
  army_equip_set(setName: string, refMode?: boolean): void;
  /** Initializes the army. */
  army_init(): void;
  /** Joins the map but waits for all players in the group to join before proceeding. */
  army_join(map: string, cell?: string, pad?: string): void;
  /** Kills the target, but waits for all players in the group to finish before proceeding. */
  army_kill(targetName: string, options?: Partial<KillOptions>): void;
  /** Kills the target for a specified item, but waits for all players in the group to get the item before proceeding. */
  army_kill_for(targetName: string, itemName: string, qty: number, isTemp: boolean, options?: Partial<KillOptions>): void;
  /** Kills the target for a specified permanent item, waiting for all players to get the item. */
  army_kill_for_item(targetName: string, itemName: string, qty: number, options?: Partial<KillOptions>): void;
  /** Kills the target for a specified temporary item, waiting for all players to get the item. */
  army_kill_for_tempitem(targetName: string, itemName: string, qty: number, options?: Partial<KillOptions>): void;
  /** Sets the config file name. */
  army_set_config(fileName: string): void;
  /** Executes a function, but waits for the function (a.k.a for all players) to finish before proceeding. */
  execute_with_army(fn: () => Promise<void>, fnName?: string): void;
  /** Attacks the target. */
  attack(target: string): void;
  /** Cancels the target. */
  cancel_target(): void;
  /** Exits combat. */
  exit_combat(): void;
  /** Uses a skill, regardless if there's a target or not. */
  force_use_skill(skill: string | number, wait?: boolean): void;
  /** Jumps to a monster's cell. */
  hunt(target: string, most?: boolean): void;
  /** Kills the target. */
  kill(target: string, options?: Partial<KillOptions>): void;
  /** Kills the target for an inventory item, until the specified quantity is reached. */
  kill_for_item(target: string, item: string | number, quantity: number, options?: Partial<KillOptions>): void;
  /** Kills the target for a temporary item, until the specified quantity is reached. */
  kill_for_tempitem(target: string, item: string | number, quantity: number, options?: Partial<KillOptions>): void;
  /** Rests the player. */
  rest(full?: boolean): void;
  /** Uses a skill. */
  use_skill(skill: string | number, wait?: boolean): void;
  /** Applies Logical AND together on the condition commands. All conditions must be true
to be satisfied. */
  and(factories: (() => void)[]): void;
  /** Whether any player's hp percentage is greater than the specified value. */
  any_player_hp_percentage_greater_than(percentage: number): void;
  /** Whether any player's hp percentage is less than the specified value. */
  any_player_hp_percentage_less_than(percentage: number): void;
  /** Whether an item can be bought from the current shop (client-side check). */
  can_buy_item(item: string): void;
  /** Whether the specified quest can be completed. */
  can_complete_quest(questId: number): void;
  /** Whether the specified quest cannot be completed. */
  cannot_complete_quest(questId: number): void;
  /** Whether the player count in the specified cell is greater than the specified value. */
  cell_player_count_greater_than(count: number, cell?: string): void;
  /** Whether the player count in the specified cell is less than the specified value. */
  cell_player_count_less_than(count: number, cell?: string): void;
  /** Whether the player has the specified item equipped. */
  equipped(item: string): void;
  /** Whether the player faction rank is greater than the specified rank. */
  faction_rank_greater_than(faction: string, rank: number): void;
  /** Whether the player faction rank is less than the specified rank. */
  faction_rank_less_than(faction: string, rank: number): void;
  /** Whether the player has more than the specified amount of gold. */
  gold_greater_than(gold: number): void;
  /** Whether the player has less than the specified amount of gold. */
  gold_less_than(gold: number): void;
  /** Whether the player does not have a target. */
  has_no_target(): void;
  /** Whether the player has a target. */
  has_target(): void;
  /** Whether the player's hp is greater than the specified amount. */
  hp_greater_than(hp: number): void;
  /** Whether the player's hp is less than the specified amount. */
  hp_less_than(hp: number): void;
  /** Whether the player's hp is greater than the specified percentage. */
  hp_percentage_greater_than(percentage: number): void;
  /** Whether the player's hp is less than the specified percentage. */
  hp_percentage_less_than(percentage: number): void;
  /** Whether a specific item exists in the player's bank. */
  in_bank(item: string, quantity?: number): void;
  /** Whether the player is in the specified cell. */
  in_cell(cell: string): void;
  /** Whether the player is in combat. */
  in_combat(): void;
  /** Whether the specified item is in the player's house inventory. */
  in_house(item: string, quantity?: number): void;
  /** Whether a specific item exists in the player's inventory. */
  in_inventory(item: string, quantity?: number): void;
  /** Whether the player is in the specified map. */
  in_map(map: string): void;
  /** Whether a specific item exists in the player's tempinventory. */
  in_tempinventory(item: string, quantity?: number): void;
  /** Whether this player's role is the leader in the army. */
  is_army_leader(): void;
  /** Whether this player's role is a member in the army. */
  is_army_member(): void;
  /** Whether the specified item is maxed in the player's inventory. */
  is_maxed(item: string): void;
  /** Whether the player has an active membership. */
  is_member(): void;
  /** Whether the specified item is not maxed in the player's inventory. */
  is_not_maxed(item: string): void;
  /** Whether the player does not have an active membership. */
  is_not_member(): void;
  /** Whether this player's role is the specified player number. */
  is_player_number(playerNumber: number): void;
  /** Whether the specified item has dropped. */
  item_has_dropped(item: string): void;
  /** Whether the specified item has not dropped. */
  item_has_not_dropped(item: string): void;
  /** Whether the player's level is greater than the specified level. */
  level_greater_than(level: number): void;
  /** Whether the player's level equals the specified level. */
  level_is(level: number): void;
  /** Whether the player's level is less than the specified level. */
  level_less_than(level: number): void;
  /** Whether the specified monster's hp is greater than the specified amount. */
  monster_hp_greater_than(monster: string, hp: number): void;
  /** Whether the specified monster's hp is less than the specified amount. */
  monster_hp_less_than(monster: string, hp: number): void;
  /** Whether the specified monster is in the room (is not dead). */
  monster_in_room(monster: string): void;
  /** Whether the specified monster is not in the room (is dead). */
  monster_not_in_room(monster: string): void;
  /** Whether the player's mp is greater than the specified amount. */
  mp_greater_than(mp: number): void;
  /** Whether the player's mp is less than the specified amount. */
  mp_less_than(mp: number): void;
  /** Whether the player does not have the specified item equipped. */
  not_equipped(item: string): void;
  /** Whether a specific item does not exist in the player's bank. */
  not_in_bank(item: string, quantity?: number): void;
  /** Whether the player is not in the specified cell. */
  not_in_cell(cell: string): void;
  /** Whether the player is not in combat. */
  not_in_combat(): void;
  /** Whether the specified item is not in the player's house inventory. */
  not_in_house(item: string, quantity?: number): void;
  /** Whether a specific item does not exist in the player's inventory. */
  not_in_inventory(item: string, quantity?: number): void;
  /** Whether the player is not in the specified map. */
  not_in_map(map: string): void;
  /** Whether a specific item does not exist in the player's tempinventory. */
  not_in_tempinventory(item: string, quantity?: number): void;
  /** Applies Logical OR together on the condition commands. At least one condition must be true
to be satisfied. */
  or(factories: (() => void)[]): void;
  /** Whether a player's aura value is greater than the specified value. */
  player_aura_greater_than(player: string, aura: string, value: number): void;
  /** Whether a player's aura value is less than the specified value. */
  player_aura_less_than(player: string, aura: string, value: number): void;
  /** Whether the player count in the map is greater than the specified value. */
  player_count_greater_than(count: number): void;
  /** Whether the player count in the map is less than the specified value. */
  player_count_less_than(count: number): void;
  /** Whether a specified player's hp is greater than the specified value. */
  player_hp_greater_than(player: string, hp: number): void;
  /** Whether a specified player's hp is less than the specified value. */
  player_hp_less_than(player: string, hp: number): void;
  /** Whether a specified player's hp percentage is greater than the specified value. */
  player_hp_percentage_greater_than(player: string, percentage: number): void;
  /** Whether a specified player's hp percentage is less than the specified value. */
  player_hp_percentage_less_than(player: string, percentage: number): void;
  /** Whether a player is in the specified cell. */
  player_in_cell(player: string, cell: string): void;
  /** Whether a player is in the map. */
  player_in_map(player: string): void;
  /** Whether the player's name is equal to the specified name. */
  player_name_equals(player: string): void;
  /** Whether a player is not in the specified cell. */
  player_not_in_cell(player: string, cell: string): void;
  /** Whether a player is not in the map. */
  player_not_in_map(player: string): void;
  /** Whether the specified quest is in progress. */
  quest_in_progress(questId: number): void;
  /** Whether the specified quest is available. */
  quest_is_available(questId: number): void;
  /** Whether the specified quest is not available. */
  quest_not_available(questId: number): void;
  /** Whether the specified quest is not in progress. */
  quest_not_in_progress(questId: number): void;
  /** Whether the target's hp is between the specified range. */
  target_hp_between(monster: string, min: number, max: number): void;
  /** Whether the target's hp is greater than the specified amount. */
  target_hp_greater_than(hp: number): void;
  /** Whether the target's hp is less than the specified amount. */
  target_hp_less_than(hp: number): void;
  /** Buys an item from the shop. */
  buy_item(shopId: number, item: string | number, quantity: number, auto?: boolean): void;
  /** Puts an item into the bank. */
  deposit(item: string | number | (string | number)[]): void;
  /** Enhances an item with the specified enhancement. */
  enhance_item(itemName: string, enhancementName: string, procName?: string): void;
  equip_item(item: string): void;
  /** Equips an item using its enhancement name. Supports colloquial variants of the enhancement name.

If results are ambiguous, the first matching item will be used. Use itemType to narrow the result. */
  equip_item_by_enhancement(enhancementName: string, itemType?: string): void;
  get_map_item(item: string | number): void;
  /** Loads a shop. */
  load_shop(shopId: number): void;
  /** Picks up an item from the drop list. */
  pickup(item: string | number): void;
  /** Registers a consumable boost to use when available. */
  register_boost(item: string): void;
  /** Registers an item to be automatically picked up when possible. */
  register_drop(items: string | string[]): void;
  /** Rejects an item from the drop list. */
  reject(item: string | number): void;
  /** Sells an item. */
  sell_item(item: string): void;
  /** Swaps an item from the bank with an item from the inventory. */
  swap(bankItem: string | number, invItem: string | number): void;
  /** Unregisters a consumable boost. */
  unregister_boost(item: string): void;
  /** Unregisters an item from the drop list. */
  unregister_drop(items: string | string[]): void;
  /** Takes out an item from the bank. */
  withdraw(item: string | number | (string | number)[]): void;
  /** Joins a map. */
  join(map: string, cell?: string, pad?: string): void;
  /** Alias for cmd.join. */
  join_map(map: string, cell?: string, pad?: string): void;
  /** Alias for cmd.move_to_cell. */
  jump_to_cell(cell: string, pad?: string): void;
  /** Moves to a cell. */
  move_to_cell(cell: string, pad?: string): void;
  /** Sets the spawnpoint. */
  set_spawn(cell?: string, pad?: string): void;
  /** Alias for cmd.set_spawn. */
  set_spawnpoint(cell?: string, pad?: string): void;
  /** Walks to a point on the map. */
  walk_to(x: number, y: number): void;
  /** Beeps the specified number of times. */
  beep(times?: number): void;
  /** Buffs by casting the first 3 skills, or the provided skill set. */
  buff(skillList?: number[], wait?: boolean): void;
  /** Buys the specified quantity of Scroll of Life Steal. */
  buy_lifesteal(qty: number): void;
  buy_scroll_of_enrage(qty: number): void;
  /** Closes the window. */
  close_window(): void;
  /** Delays command execution for a specified amount of time. */
  delay(ms: number): void;
  /** Disables the anti-counter attack setting. */
  disable_anticounter(): void;
  /** Disables the "Disable collisions" setting. */
  disable_collisions(): void;
  /** Disables the "Enemy magnet" setting. */
  disable_enemymagnet(): void;
  /** Disables the "Disable FX" setting. */
  disable_fx(): void;
  /** Disables the "Hide players" setting. */
  disable_hideplayers(): void;
  /** Disables the "Infinite range" setting. */
  disable_infiniterange(): void;
  /** Disables the "Lag killer" setting. */
  disable_lagkiller(): void;
  /** Disables the "Provoke cell" setting. */
  disable_provokecell(): void;
  /** Disables the "Skip cutscenes" setting. */
  disable_skipcutscenes(): void;
  /** Performs loop taunt based on one or more strategies. See [looptaunt guide](/guides/looptaunt) for more details. */
  do_looptaunt(strategies: [string, number, number, string?][]): void;
  /** Does the Wheel of Doom spin (non-members). */
  do_wheelofdoom(to_bank?: boolean): void;
  /** Drinks consumable items. */
  drink_consumables(items: string | string[], equipAfter?: string): void;
  /** Enables the anti-counter attack setting. */
  enable_anticounter(): void;
  /** Enables the "Disable collisions" setting. */
  enable_collisions(): void;
  /** Enables the "Enemy magnet" setting. */
  enable_enemymagnet(): void;
  /** Enables the "Disable FX" setting. */
  enable_fx(): void;
  /** Enables the "Hide players" setting. */
  enable_hideplayers(): void;
  /** Enables the "Infinite range" setting. */
  enable_infiniterange(): void;
  /** Enables the "Lag killer" setting. */
  enable_lagkiller(): void;
  /** Enables the "Provoke cell" setting. */
  enable_provokecell(): void;
  /** Enables the "Skip cutscenes" setting. */
  enable_skipcutscenes(): void;
  /** Goes to a player's house. */
  goto_house(player?: string): void;
  /** Goes to a label in the script. */
  goto_label(label: string): void;
  /** Goes to a player. */
  goto_player(player: string): void;
  /** Defines a label in the script. */
  label(label: string): void;
  /** Logs a message ingame. */
  log(msg: string): void;
  /** Logs out of the game. */
  logout(): void;
  register_command(name: string, cmdFactory: (CommandClass: CommandConstructor) => CommandConstructor): void;
  /** Registers a packet handler. */
  register_handler(type: "packetFromClient" | "packetFromServer" | "pext", name: string, handler: ((packet: Record<string, unknown>) => void | Promise<void>) | ((packet: string) => void | Promise<void>)): void;
  /** Registers a task (a.k.a background job) to be executed alongside commands.
The task function is bound to an object containing the bot instance and the context instance. */
  register_task(name: string, taskFn: () => Promise<void>): void;
  /** Sets the auto register requirements flag for the Environment. */
  set_auto_register_requirements(val: boolean): void;
  /** Sets the auto register rewards flag for the Environment. */
  set_auto_register_rewards(val: boolean): void;
  /** Sets the delay between commands. */
  set_delay(delay: number): void;
  /** Sets the target FPS for the game. */
  set_fps(fps: number): void;
  /** Sets the client's locally visible guild name. */
  set_guild(guild: string): void;
  /** Sets the client's locally visible name. */
  set_name(name: string): void;
  /** Sets the rejectElse flag for the Environment. */
  set_reject_else(val: boolean): void;
  /** Sets the walk speed of the player. */
  set_walk_speed(speed: number): void;
  /** Stops the bot. */
  stop_bot(): void;
  unregister_command(name: string): void;
  unregister_handler(type: "packetFromClient" | "packetFromServer" | "pext", name: string): void;
  /** Unregisters a previously registered task. */
  unregister_task(name: string): void;
  /** Sets the credentials to use for Auto Relogin.
After a login attempt, the client stores the username and password used to log in, regardless if successful. These fields are re-used
when null(s) are passed. */
  use_autorelogin(username: string | null, password: string | null, server: string | null): void;
  /** Enables auto-zoning for astralshrine map. */
  use_autozone_astralshrine(): void;
  /** Enables auto-zoning for darkcarnax map. */
  use_autozone_darkcarnax(): void;
  /** Enables auto-zoning for ledgermayne map. */
  use_autozone_ledgermayne(): void;
  /** Enables auto-zoning for moreskulls map. */
  use_autozone_moreskulls(): void;
  /** Enables auto-zoning for queeniona map. */
  use_autozone_queeniona(): void;
  /** Enables auto-zoning for ultradage map. */
  use_autozone_ultradage(): void;
  /** Waits for a specific number of players to be in the map. */
  wait_for_player_count(count: number, exact?: boolean): void;
  /** Abandons a quest. */
  abandon_quest(questId: number): void;
  /** Accepts a quest. */
  accept_quest(questId: number): void;
  /** Completes a quest. */
  complete_quest(questId: number, itemId?: number): void;
  /** Registers one or more quests, which automatically handles accepting and completing them. */
  register_quest(questIds: number | [number, number] | (number | [number, number])[], itemId?: number): void;
  /** Unregisters one or more quests. */
  unregister_quest(questIds: number | number[]): void;
};

export = cmd;
export as namespace cmd;
