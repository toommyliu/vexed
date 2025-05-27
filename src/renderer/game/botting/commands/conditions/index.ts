import { ArgsError } from "../../ArgsError";
import { CommandCellIs } from "./CommandCellIs";
import { CommandCellIsNot } from "./CommandCellIsNot";
import { CommandCellPlayerCountGreaterThan } from "./CommandCellPlayerCountGreaterThan";
import { CommandCellPlayerCountLessThan } from "./CommandCellPlayerCountLessThan";
import { CommandFactionRankGreaterThan } from "./CommandFactionRankGreaterThan";
import { CommandFactionRankLessThan } from "./CommandFactionRankLessThan";
import { CommandGoldGreaterThan } from "./CommandGoldGreaterThan";
import { CommandGoldLessThan } from "./CommandGoldLessThan";
import { CommandHasTarget } from "./CommandHasTarget";
import { CommandInBank } from "./CommandInBank";
import { CommandInCombat } from "./CommandInCombat";
import { CommandInHouse } from "./CommandInHouse";
import { CommandInInventory } from "./CommandInInventory";
import { CommandIsEquipped } from "./CommandIsEquipped";
import { CommandIsInTemp } from "./CommandIsInTemp";
import { CommandIsMaxStack } from "./CommandIsMaxStack";
import { CommandIsMember } from "./CommandIsMember";
import { CommandIsNotInTemp } from "./CommandIsNotInTemp";
import { CommandIsNotMaxStack } from "./CommandIsNotMaxStack";
import { CommandIsNotMember } from "./CommandIsNotMember";
import { CommandIsPlayerArmyLeader } from "./CommandIsPlayerArmyLeader";
import { CommandIsPlayerArmyMember } from "./CommandIsPlayerArmyMember";
import { CommandIsPlayerNumber } from "./CommandIsPlayerNumber";
import { CommandItemHasDropped } from "./CommandItemHasDropped";
import { CommandItemHasNotDropped } from "./CommandItemHasNotDropped";
import { CommandLevelGreaterThan } from "./CommandLevelGreaterThan";
import { CommandLevelIs } from "./CommandLevelIs";
import { CommandLevelIsLessThan } from "./CommandLevelLessThan";
import { CommandMapIs } from "./CommandMapIs";
import { CommandMapIsNot } from "./CommandMapIsNot";
import { CommandMonsterHpGreaterThan } from "./CommandMonsterHpGreaterThan";
import { CommandMonsterHpLessThan } from "./CommandMonsterHpLessThan";
import { CommandMonsterInRoom } from "./CommandMonsterInRoom";
import { CommandMonsterNotInRoom } from "./CommandMonsterNotInRoom";
import { CommandMpGreaterThan } from "./CommandMpGreaterThan";
import { CommandMpLessThan } from "./CommandMpLessThan";
import { CommandNotEquipped } from "./CommandNotEquipped";
import { CommandNotHasTarget } from "./CommandNotHasTarget";
import { CommandNotInBank } from "./CommandNotInBank";
import { CommandNotInCombat } from "./CommandNotInCombat";
import { CommandNotInHouse } from "./CommandNotInHouse";
import { CommandNotInInventory } from "./CommandNotInInventory";
import { CommandPlayerAurasGreaterThan } from "./CommandPlayerAurasGreaterThan";
import { CommandPlayerAurasLessThan } from "./CommandPlayerAurasLessThan";
import { CommandPlayerCountGreaterThan } from "./CommandPlayerCountGreaterThan";
import { CommandPlayerCountLessThan } from "./CommandPlayerCountLessThan";
import { CommandPlayerHpGreaterThan } from "./CommandPlayerHpGreaterThan";
import { CommandPlayerHpLessThan } from "./CommandPlayerHpLessThan";
import { CommandPlayerHpPercentageGreaterThan } from "./CommandPlayerHpPercentageGreaterThan";
import { CommandPlayerHpPercentageLessThan } from "./CommandPlayerHpPercentageLessThan";
import { CommandPlayerIsInCell } from "./CommandPlayerIsInCell";
import { CommandPlayerIsInMap } from "./CommandPlayerIsInMap";
import { CommandPlayerIsNotInCell } from "./CommandPlayerIsNotInCell";
import { CommandPlayerIsNotInMap } from "./CommandPlayerIsNotInMap";
import { CommandPlayerNameIs } from "./CommandPlayerNameIs";
import { CommandQuestCanComplete } from "./CommandQuestCanComplete";
import { CommandQuestCanNotComplete } from "./CommandQuestCanNotComplete";
import { CommandQuestInProgress } from "./CommandQuestInProgress";
import { CommandQuestIsAvailable } from "./CommandQuestIsAvailable";
import { CommandQuestIsNotAvailable } from "./CommandQuestNotAvailable";
import { CommandQuestNotInProgress } from "./CommandQuestNotInProgress";
import { CommandTargetHpBetween } from "./CommandTargetHpBetween";
import { CommandTargetHealthGreaterThan as CommandTargetHpGreaterThan } from "./CommandTargetHpGreaterThan";
import { CommandTargetHpLessThan } from "./CommandTargetHpLessThan";

export const conditionsCommands = {
  /**
   * Whether the player is in the specified cell.
   *
   * @param cell - THe name of the cell.
   */
  in_cell(cell: string) {
    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    const cmd = new CommandCellIs();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player is not in the specified cell.
   *
   * @param cell - The name of the cell.
   */
  not_in_cell(cell: string) {
    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    const cmd = new CommandCellIsNot();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player has the specified item equipped.
   *
   * @param item - The name of the item.
   */
  equipped(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandIsEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player does not have the specified item equipped.
   *
   * @param item - The name of the item.
   */
  not_equipped(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandNotEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player faction rank is greater than the specified rank.
   *
   * @param faction - The name of the faction.
   * @param rank - The rank to compare against.
   */
  faction_rank_greater_than(faction: string, rank: number) {
    if (!faction || typeof faction !== "string") {
      throw new ArgsError("faction is required");
    }

    if (!rank || typeof rank !== "number") {
      throw new ArgsError("rank is required");
    }

    const cmd = new CommandFactionRankGreaterThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player faction rank is less than the specified rank.
   *
   * @param faction - The name of the faction.
   * @param rank - The rank to compare against.
   */
  faction_rank_less_than(faction: string, rank: number) {
    if (!faction || typeof faction !== "string") {
      throw new ArgsError("faction is required");
    }

    if (!rank || typeof rank !== "number") {
      throw new ArgsError("rank is required");
    }

    const cmd = new CommandFactionRankLessThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player has more than the specified amount of gold.
   *
   * @param gold - The amount of gold to compare against.
   */
  gold_greater_than(gold: number) {
    if (!gold || typeof gold !== "number") {
      throw new ArgsError("gold is required");
    }

    const cmd = new CommandGoldGreaterThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player has less than the specified amount of gold.
   *
   * @param gold - The amount of gold to compare against.
   */
  gold_less_than(gold: number) {
    if (!gold || typeof gold !== "number") {
      throw new ArgsError("gold is required");
    }

    const cmd = new CommandGoldLessThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player has a target.
   */
  has_target() {
    const cmd = new CommandHasTarget();
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player does not have a target.
   */
  has_no_target() {
    const cmd = new CommandNotHasTarget();
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's hp is greater than the specified amount.
   *
   * @param hp - The amount of health to compare against.
   */
  hp_greater_than(hp: number) {
    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandPlayerHpGreaterThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's hp is less than the specified amount.
   *
   * @param hp - The amount of health to compare against.
   */
  hp_less_than(hp: number) {
    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandPlayerHpLessThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's hp is greater than the specified percentage.
   *
   * @param percentage - The percentage of health to compare against.
   */
  hp_percentage_greater_than(percentage: number) {
    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageGreaterThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's hp is less than the specified percentage.
   *
   * @param percentage - The percentage of health to compare against.
   */
  hp_percentage_less_than(percentage: number) {
    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageLessThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item exists in the player's inventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  in_inventory(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandInInventory();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item does not exist in the player's inventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  not_in_inventory(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandNotInInventory();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item exists in the player's tempinventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  in_tempinventory(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandIsInTemp();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item does not exist in the player's tempinventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  not_in_tempinventory(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandIsNotInTemp();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item exists in the player's bank.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  in_bank(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandInBank();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specific item does not exist in the player's bank.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  not_in_bank(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandNotInBank();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player is in combat.
   */
  in_combat() {
    const cmd = new CommandInCombat();
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player is not in combat.
   */
  not_in_combat() {
    const cmd = new CommandNotInCombat();
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item is in the player's house inventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  in_house(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandInHouse();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item is not in the player's house inventory.
   *
   * @param item - The name of the item.
   * @param quantity - The minimum quantity required. If not provided, it will default to 1.
   */
  not_in_house(item: string, quantity?: number) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item name is required");
    }

    const cmd = new CommandNotInHouse();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player has an active membership.
   */
  is_member() {
    const cmd = new CommandIsMember();
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player does not have an active membership.
   */
  is_not_member() {
    const cmd = new CommandIsNotMember();
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player's aura value is greater than the specified value.
   *
   * @param player - The name of the player.
   * @param aura - The name of the aura.
   * @param value - The value to compare against.
   */
  player_aura_greater_than(player: string, aura: string, value: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!aura || typeof aura !== "string") {
      throw new ArgsError("aura is required");
    }

    if (!value || typeof value !== "number") {
      throw new ArgsError("value is required");
    }

    const cmd = new CommandPlayerAurasGreaterThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player's aura value is less than the specified value.
   *
   * @param player - The name of the player.
   * @param aura - The name of the aura.
   * @param value - The value to compare against.
   */
  player_aura_less_than(player: string, aura: string, value: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!aura || typeof aura !== "string") {
      throw new ArgsError("aura is required");
    }

    if (!value || typeof value !== "number") {
      throw new ArgsError("value is required");
    }

    const cmd = new CommandPlayerAurasLessThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specified player's hp is greater than the specified value.
   *
   * @param player - The name of the player.
   * @param hp - The health value to compare against.
   */
  player_hp_greater_than(player: string, hp: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandPlayerHpGreaterThan();
    cmd.player = player;
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specified player's hp is less than the specified value.
   *
   * @param player - The name of the player.
   * @param hp - The health value to compare against.
   */
  player_hp_less_than(player: string, hp: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandPlayerHpLessThan();
    cmd.player = player;
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specified player's hp percentage is greater than the specified value.
   *
   * @param player - The name of the player.
   * @param percentage - The health percentage to compare against.
   */
  player_hp_percentage_greater_than(player: string, percentage: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageGreaterThan();
    cmd.player = player;
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a specified player's hp percentage is less than the specified value.
   *
   * @param player - The name of the player.
   * @param percentage - The health percentage to compare against.
   */
  player_hp_percentage_less_than(player: string, percentage: number) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageLessThan();
    cmd.player = player;
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether any player's hp percentage is greater than the specified value.
   *
   * @param percentage - The health percentage to compare against.
   */
  any_player_hp_percentage_greater_than(percentage: number) {
    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageGreaterThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether any player's hp percentage is less than the specified value.
   *
   * @param percentage - The health percentage to compare against.
   */
  any_player_hp_percentage_less_than(percentage: number) {
    if (!percentage || typeof percentage !== "number") {
      throw new ArgsError("percentage is required");
    }

    const cmd = new CommandPlayerHpPercentageLessThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player count in the map is greater than the specified value.
   *
   * @param count - The number of players to compare against.
   */
  player_count_greater_than(count: number) {
    if (!count || typeof count !== "number") {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandPlayerCountGreaterThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player count in the map is less than the specified value.
   *
   * @param count - The number of players to compare against.
   */
  player_count_less_than(count: number) {
    if (!count || typeof count !== "number") {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandPlayerCountLessThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player is in the map.
   *
   * @param player - The name of the player.
   */
  player_in_map(player: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    const cmd = new CommandPlayerIsInMap();
    cmd.player = player;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player is in the specified cell.
   *
   * @param player - The name of the player.
   * @param cell - The name of the cell.
   */
  player_in_cell(player: string, cell: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell name is required");
    }

    const cmd = new CommandPlayerIsInCell();
    cmd.player = player;
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player is not in the map.
   *
   * @param player - The name of the player.
   */
  player_not_in_map(player: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    const cmd = new CommandPlayerIsNotInMap();
    cmd.player = player;
    window.context.addCommand(cmd);
  },
  /**
   * Whether a player is not in the specified cell.
   *
   * @param player - The name of the player.
   * @param cell - The name of the cell.
   */
  player_not_in_cell(player: string, cell: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    const cmd = new CommandPlayerIsNotInCell();
    cmd.player = player;
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's name is equal to the specified name.
   *
   * @param player - The name to compare against.
   */
  player_name_equals(player: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    const cmd = new CommandPlayerNameIs();
    cmd.player = player;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest can be completed.
   *
   * @param questId - The ID of the quest to check.
   */
  can_complete_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestCanComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest cannot be completed.
   *
   * @param questId - The ID of the quest to check.
   */
  cannot_complete_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestCanNotComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest is in progress.
   *
   * @param questId - The ID of the quest to check.
   */
  quest_in_progress(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest is not in progress.
   *
   * @param questId - The ID of the quest to check.
   */
  quest_not_in_progress(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestNotInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest is available.
   *
   * @param questId - The ID of the quest to check.
   */
  quest_is_available(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestIsAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified quest is not available.
   *
   * @param questId - The ID of the quest to check.
   */
  quest_not_available(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandQuestIsNotAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the target's hp is greater than the specified amount.
   *
   * @param hp - Hp to compare against.
   */
  target_hp_greater_than(hp: number) {
    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandTargetHpGreaterThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the target's hp is less than the specified amount.
   *
   * @param hp - Hp to compare against.
   */
  target_hp_less_than(hp: number) {
    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandTargetHpLessThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the target's hp is between the specified range.
   *
   * @param monster - The name of the monster.
   * @param min - The minimum hp.
   * @param max - The maximum hp.
   */
  target_hp_between(monster: string, min: number, max: number) {
    if (!monster || typeof monster !== "string") {
      throw new ArgsError("monster is required");
    }

    if (!min || typeof min !== "number") {
      throw new ArgsError("min is required");
    }

    if (!max || typeof max !== "number") {
      throw new ArgsError("max is required");
    }

    const cmd = new CommandTargetHpBetween();
    cmd.lower = min;
    cmd.upper = max;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item is maxed in the player's inventory.
   *
   * @param item - The name of the item.
   */
  is_maxed(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandIsMaxStack();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item is not maxed in the player's inventory.
   *
   * @param item - The name of the item.
   */
  is_not_maxed(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandIsNotMaxStack();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player count in the specified cell is greater than the specified value.
   *
   * @param count - The number of players to compare against.
   * @param cell - The name of the cell. If not provided, it will default to the current cell.
   */
  cell_player_count_greater_than(count: number, cell?: string) {
    if (!count || typeof count !== "number") {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandCellPlayerCountGreaterThan();
    if (cell) cmd.cell = cell;
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player count in the specified cell is less than the specified value.
   *
   * @param count - The number of players to compare against.
   * @param cell - The name of the cell. If not provided, it will default to the current cell.
   */
  cell_player_count_less_than(count: number, cell?: string) {
    if (!count || typeof count !== "number") {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandCellPlayerCountLessThan();
    if (cell) cmd.cell = cell;
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item has dropped.
   *
   * @param item - The name of the item.
   */
  item_has_dropped(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandItemHasDropped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified item has not dropped.
   *
   * @param item - The name of the item.
   */
  item_has_not_dropped(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandItemHasNotDropped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's level equals the specified level.
   *
   * @param level - The level to compare against.
   */
  level_is(level: number) {
    if (!level || typeof level !== "number") {
      throw new ArgsError("level is required");
    }

    const cmd = new CommandLevelIs();
    cmd.level = Math.floor(level);
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's level is greater than the specified level.
   *
   * @param level - The level to compare against.
   */
  level_greater_than(level: number) {
    if (!level || typeof level !== "number") {
      throw new ArgsError("level is required");
    }

    const cmd = new CommandLevelGreaterThan();
    cmd.level = level;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's level is less than the specified level.
   *
   * @param level - The level to compare against.
   */
  level_less_than(level: number) {
    if (!level || typeof level !== "number") {
      throw new ArgsError("level is required");
    }

    const cmd = new CommandLevelIsLessThan();
    cmd.level = level;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's mp is greater than the specified amount.
   *
   * @param mp - The mp value to compare against.
   */
  mp_greater_than(mp: number) {
    if (!mp || typeof mp !== "number") {
      throw new ArgsError("mp is required");
    }

    const cmd = new CommandMpGreaterThan();
    cmd.mana = mp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player's mp is less than the specified amount.
   *
   * @param mp - The mp value to compare against.
   */
  mp_less_than(mp: number) {
    if (!mp || typeof mp !== "number") {
      throw new ArgsError("mp is required");
    }

    const cmd = new CommandMpLessThan();
    cmd.mana = mp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player is in the specified map.
   *
   * @param map - The name of the map.
   */
  in_map(map: string) {
    if (!map || typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    const cmd = new CommandMapIs();
    cmd.map = map;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the player is not in the specified map.
   *
   * @param map - The name of the map.
   */
  not_in_map(map: string) {
    if (!map || typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    const cmd = new CommandMapIsNot();
    cmd.map = map;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified monster's hp is greater than the specified amount.
   *
   * @param monster - The name of the monster.
   * @param hp - The health value to compare against.
   */
  monster_hp_greater_than(monster: string, hp: number) {
    if (!monster || typeof monster !== "string") {
      throw new ArgsError("monster is required");
    }

    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandMonsterHpGreaterThan();
    cmd.monster = monster;
    cmd.health = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified monster's hp is less than the specified amount.
   *
   * @param monster - The name of the monster.
   * @param hp - The health value to compare against.
   */
  monster_hp_less_than(monster: string, hp: number) {
    if (!monster || typeof monster !== "string") {
      throw new ArgsError("monster is required");
    }

    if (!hp || typeof hp !== "number") {
      throw new ArgsError("hp is required");
    }

    const cmd = new CommandMonsterHpLessThan();
    cmd.monster = monster;
    cmd.health = hp;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified monster is in the room (is not dead).
   *
   * @param monster - The name of the monster.
   */
  monster_in_room(monster: string) {
    if (!monster || typeof monster !== "string") {
      throw new ArgsError("monster is required");
    }

    const cmd = new CommandMonsterInRoom();
    cmd.monster = monster;
    window.context.addCommand(cmd);
  },
  /**
   * Whether the specified monster is not in the room (is dead).
   *
   * @param monster - The name of the monster.
   */
  monster_not_in_room(monster: string) {
    if (!monster || typeof monster !== "string") {
      throw new ArgsError("monster is required");
    }

    const cmd = new CommandMonsterNotInRoom();
    cmd.monster = monster;
    window.context.addCommand(cmd);
  },
  /**
   * Whether this player's role is a member in the army.
   */
  is_army_member() {
    const cmd = new CommandIsPlayerArmyMember();
    window.context.addCommand(cmd);
  },
  /**
   * Whether this player's role is the leader in the army.
   */
  is_army_leader() {
    const cmd = new CommandIsPlayerArmyLeader();
    window.context.addCommand(cmd);
  },
  /**
   * Whether this player's role is the specified player number.
   *
   * @param playerNumber - The player number to check.
   */
  is_player_number(playerNumber: number) {
    if (!playerNumber || typeof playerNumber !== "number") {
      throw new ArgsError("playerNumber is required");
    }

    const cmd = new CommandIsPlayerNumber();
    cmd.playerNumber = playerNumber;
    window.context.addCommand(cmd);
  },
};
