import { ArgsError } from '../../ArgsError';
import { CommandCellIs } from './CommandCellIs';
import { CommandCellIsNot } from './CommandCellIsNot';
import { CommandCellPlayerCountGreaterThan } from './CommandCellPlayerCountGreaterThan';
import { CommandCellPlayerCountLessThan } from './CommandCellPlayerCountLessThan';
import { CommandFactionRankGreaterThan } from './CommandFactionRankGreaterThan';
import { CommandFactionRankLessThan } from './CommandFactionRankLessThan';
import { CommandGoldGreaterThan } from './CommandGoldGreaterThan';
import { CommandGoldLessThan } from './CommandGoldLessThan';
import { CommandHasTarget } from './CommandHasTarget';
import { CommandInBank } from './CommandInBank';
import { CommandInCombat } from './CommandInCombat';
import { CommandInHouse } from './CommandInHouse';
import { CommandInInventory } from './CommandInInventory';
import { CommandIsEquipped } from './CommandIsEquipped';
import { CommandIsInTemp } from './CommandIsInTemp';
import { CommandIsMaxStack } from './CommandIsMaxStack';
import { CommandIsMember } from './CommandIsMember';
import { CommandIsNotInTemp } from './CommandIsNotInTemp';
import { CommandIsNotMaxStack } from './CommandIsNotMaxStack';
import { CommandIsNotMember } from './CommandIsNotMember';
import { CommandItemHasDropped } from './CommandItemHasDropped';
import { CommandItemHasNotDropped } from './CommandItemHasNotDropped';
import { CommandLevelGreaterThan } from './CommandLevelGreaterThan';
import { CommandLevelIs } from './CommandLevelIs';
import { CommandLevelIsLessThan } from './CommandLevelLessThan';
import { CommandMapIs } from './CommandMapIs';
import { CommandMapIsNot } from './CommandMapIsNot';
import { CommandMonsterHpGreaterThan } from './CommandMonsterHpGreaterThan';
import { CommandMonsterHpLessThan } from './CommandMonsterHpLessThan';
import { CommandMonsterInRoom } from './CommandMonsterInRoom';
import { CommandMonsterNotInRoom } from './CommandMonsterNotInRoom';
import { CommandMpGreaterThan } from './CommandMpGreaterThan';
import { CommandMpLessThan } from './CommandMpLessThan';
import { CommandNotEquipped } from './CommandNotEquipped';
import { CommandNotHasTarget } from './CommandNotHasTarget';
import { CommandNotInBank } from './CommandNotInBank';
import { CommandNotInCombat } from './CommandNotInCombat';
import { CommandNotInHouse } from './CommandNotInHouse';
import { CommandNotInInventory } from './CommandNotInInventory';
import { CommandPlayerAurasGreaterThan } from './CommandPlayerAurasGreaterThan';
import { CommandPlayerAurasLessThan } from './CommandPlayerAurasLessThan';
import { CommandPlayerCountGreaterThan } from './CommandPlayerCountGreaterThan';
import { CommandPlayerCountLessThan } from './CommandPlayerCountLessThan';
import { CommandPlayerHpGreaterThan } from './CommandPlayerHpGreaterThan';
import { CommandPlayerHpLessThan } from './CommandPlayerHpLessThan';
import { CommandPlayerHpPercentageGreaterThan } from './CommandPlayerHpPercentageGreaterThan';
import { CommandPlayerHpPercentageLessThan } from './CommandPlayerHpPercentageLessThan';
import { CommandPlayerIsInCell } from './CommandPlayerIsInCell';
import { CommandPlayerIsInMap } from './CommandPlayerIsInMap';
import { CommandPlayerIsNotInCell } from './CommandPlayerIsNotInCell';
import { CommandPlayerIsNotInMap } from './CommandPlayerIsNotInMap';
import { CommandPlayerNameIs } from './CommandPlayerNameIs';
import { CommandQuestCanComplete } from './CommandQuestCanComplete';
import { CommandQuestCanNotComplete } from './CommandQuestCanNotComplete';
import { CommandQuestInProgress } from './CommandQuestInProgress';
import { CommandQuestIsAvailable } from './CommandQuestIsAvailable';
import { CommandQuestIsNotAvailable } from './CommandQuestNotAvailable';
import { CommandQuestNotInProgress } from './CommandQuestNotInProgress';
import { CommandTargetHpBetween } from './CommandTargetHpBetween';
import { CommandTargetHealthGreaterThan as CommandTargetHpGreaterThan } from './CommandTargetHpGreaterThan';
import { CommandTargetHpLessThan } from './CommandTargetHpLessThan';

export const conditionsCommands = {
  in_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new ArgsError('cell is required');
    }

    const cmd = new CommandCellIs();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },
  not_in_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new ArgsError('cell is required');
    }

    const cmd = new CommandCellIsNot();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  equipped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandIsEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  not_equipped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandNotEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },

  faction_rank_greater_than(faction: string, rank: number) {
    if (!faction || typeof faction !== 'string') {
      throw new ArgsError('faction is required');
    }

    if (!rank || typeof rank !== 'number') {
      throw new ArgsError('rank is required');
    }

    const cmd = new CommandFactionRankGreaterThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },
  faction_rank_less_than(faction: string, rank: number) {
    if (!faction || typeof faction !== 'string') {
      throw new ArgsError('faction is required');
    }

    if (!rank || typeof rank !== 'number') {
      throw new ArgsError('rank is required');
    }

    const cmd = new CommandFactionRankLessThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },

  gold_greater_than(gold: number) {
    if (!gold || typeof gold !== 'number') {
      throw new ArgsError('gold is required');
    }

    const cmd = new CommandGoldGreaterThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },
  gold_less_than(gold: number) {
    if (!gold || typeof gold !== 'number') {
      throw new ArgsError('gold is required');
    }

    const cmd = new CommandGoldLessThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },

  has_target() {
    const cmd = new CommandHasTarget();
    window.context.addCommand(cmd);
  },
  has_no_target() {
    const cmd = new CommandNotHasTarget();
    window.context.addCommand(cmd);
  },

  hp_greater_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandPlayerHpGreaterThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  hp_less_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandPlayerHpLessThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  hp_percentage_greater_than(percentage: number) {
    if (!percentage || typeof percentage !== 'number') {
      throw new ArgsError('percentage is required');
    }

    const cmd = new CommandPlayerHpPercentageGreaterThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  hp_percentage_less_than(percentage: number) {
    if (!percentage || typeof percentage !== 'number') {
      throw new ArgsError('percentage is required');
    }

    const cmd = new CommandPlayerHpPercentageLessThan();
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },

  in_inventory(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandInInventory();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  not_in_inventory(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandNotInInventory();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  in_tempinventory(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandIsInTemp();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  not_in_tempinventory(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandIsNotInTemp();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  in_bank(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandInBank();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  not_in_bank(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandNotInBank();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  in_combat() {
    const cmd = new CommandInCombat();
    window.context.addCommand(cmd);
  },
  not_in_combat() {
    const cmd = new CommandNotInCombat();
    window.context.addCommand(cmd);
  },

  in_house(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandInHouse();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },
  not_in_house(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item name is required');
    }

    const cmd = new CommandNotInHouse();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  is_member() {
    const cmd = new CommandIsMember();
    window.context.addCommand(cmd);
  },
  is_not_member() {
    const cmd = new CommandIsNotMember();
    window.context.addCommand(cmd);
  },

  player_aura_greater_than(player: string, aura: string, value: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!aura || typeof aura !== 'string') {
      throw new ArgsError('aura is required');
    }

    if (!value || typeof value !== 'number') {
      throw new ArgsError('value is required');
    }

    const cmd = new CommandPlayerAurasGreaterThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },
  player_aura_less_than(player: string, aura: string, value: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!aura || typeof aura !== 'string') {
      throw new ArgsError('aura is required');
    }

    if (!value || typeof value !== 'number') {
      throw new ArgsError('value is required');
    }

    const cmd = new CommandPlayerAurasLessThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },

  player_hp_greater_than(player: string, hp: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandPlayerHpGreaterThan();
    cmd.player = player;
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  player_hp_less_than(player: string, hp: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandPlayerHpLessThan();
    cmd.player = player;
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },

  player_hp_percentage_greater_than(player: string, percentage: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!percentage || typeof percentage !== 'number') {
      throw new ArgsError('percentage is required');
    }

    const cmd = new CommandPlayerHpPercentageGreaterThan();
    cmd.player = player;
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },
  player_hp_percentage_less_than(player: string, percentage: number) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!percentage || typeof percentage !== 'number') {
      throw new ArgsError('percentage is required');
    }

    const cmd = new CommandPlayerHpPercentageLessThan();
    cmd.player = player;
    cmd.percentage = percentage;
    window.context.addCommand(cmd);
  },

  player_count_greater_than(count: number) {
    if (!count || typeof count !== 'number') {
      throw new ArgsError('count is required');
    }

    const cmd = new CommandPlayerCountGreaterThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  player_count_less_than(count: number) {
    if (!count || typeof count !== 'number') {
      throw new ArgsError('count is required');
    }

    const cmd = new CommandPlayerCountLessThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },

  player_in_map(map: string) {
    if (!map || typeof map !== 'string') {
      throw new ArgsError('map name is required');
    }

    const cmd = new CommandPlayerIsInMap();
    cmd.player = map;
    window.context.addCommand(cmd);
  },

  player_in_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new ArgsError('cell name is required');
    }

    const cmd = new CommandPlayerIsInCell();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  player_not_in_map(player: string) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    const cmd = new CommandPlayerIsNotInMap();
    cmd.player = player;
    window.context.addCommand(cmd);
  },

  player_not_in_cell(player: string, cell: string) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    if (!cell || typeof cell !== 'string') {
      throw new ArgsError('cell is required');
    }

    const cmd = new CommandPlayerIsNotInCell();
    cmd.player = player;
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  player_name_equals(player: string) {
    if (!player || typeof player !== 'string') {
      throw new ArgsError('player is required');
    }

    const cmd = new CommandPlayerNameIs();
    cmd.player = player;
    window.context.addCommand(cmd);
  },

  can_complete_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestCanComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  cannot_complete_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestCanNotComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  quest_in_progress(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  quest_not_in_progress(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestNotInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  quest_is_available(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestIsAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  quest_not_available(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandQuestIsNotAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  target_hp_greater_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandTargetHpGreaterThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  target_hp_less_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandTargetHpLessThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  target_hp_between(monster: string, min: number, max: number) {
    if (!monster || typeof monster !== 'string') {
      throw new ArgsError('monster is required');
    }

    if (!min || typeof min !== 'number') {
      throw new ArgsError('min is required');
    }

    if (!max || typeof max !== 'number') {
      throw new ArgsError('max is required');
    }

    const cmd = new CommandTargetHpBetween();
    cmd.lower = min;
    cmd.upper = max;
    window.context.addCommand(cmd);
  },

  maxed(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandIsMaxStack();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  not_maxed(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandIsNotMaxStack();
    cmd.item = item;
    window.context.addCommand(cmd);
  },

  cell_player_count_greater_than(count: number, cell?: string) {
    if (!count || typeof count !== 'number') {
      throw new ArgsError('count is required');
    }

    const cmd = new CommandCellPlayerCountGreaterThan();
    if (cell) cmd.cell = cell;
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  cell_player_count_less_than(count: number, cell?: string) {
    if (!count || typeof count !== 'number') {
      throw new ArgsError('count is required');
    }

    const cmd = new CommandCellPlayerCountLessThan();
    if (cell) cmd.cell = cell;
    cmd.count = count;
    window.context.addCommand(cmd);
  },

  item_has_dropped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandItemHasDropped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  item_has_not_dropped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new ArgsError('item is required');
    }

    const cmd = new CommandItemHasNotDropped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },

  level_is(level: number) {
    if (!level || typeof level !== 'number') {
      throw new ArgsError('level is required');
    }

    const cmd = new CommandLevelIs();
    cmd.level = level;
    window.context.addCommand(cmd);
  },
  level_greater_than(level: number) {
    if (!level || typeof level !== 'number') {
      throw new ArgsError('level is required');
    }

    const cmd = new CommandLevelGreaterThan();
    cmd.level = level;
    window.context.addCommand(cmd);
  },
  level_less_than(level: number) {
    if (!level || typeof level !== 'number') {
      throw new ArgsError('level is required');
    }

    const cmd = new CommandLevelIsLessThan();
    cmd.level = level;
    window.context.addCommand(cmd);
  },

  mp_greater_than(mana: number) {
    if (!mana || typeof mana !== 'number') {
      throw new ArgsError('mana is required');
    }

    const cmd = new CommandMpGreaterThan();
    cmd.mana = mana;
    window.context.addCommand(cmd);
  },
  mp_less_than(mana: number) {
    if (!mana || typeof mana !== 'number') {
      throw new ArgsError('mana is required');
    }

    const cmd = new CommandMpLessThan();
    cmd.mana = mana;
    window.context.addCommand(cmd);
  },

  in_map(map: string) {
    if (!map || typeof map !== 'string') {
      throw new ArgsError('map is required');
    }

    const cmd = new CommandMapIs();
    cmd.map = map;
    window.context.addCommand(cmd);
  },
  not_in_map(map: string) {
    if (!map || typeof map !== 'string') {
      throw new ArgsError('map is required');
    }

    const cmd = new CommandMapIsNot();
    cmd.map = map;
    window.context.addCommand(cmd);
  },

  monster_hp_greater_than(monster: string, hp: number) {
    if (!monster || typeof monster !== 'string') {
      throw new ArgsError('monster is required');
    }

    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandMonsterHpGreaterThan();
    cmd.monster = monster;
    cmd.health = hp;
    window.context.addCommand(cmd);
  },
  monster_hp_less_than(monster: string, hp: number) {
    if (!monster || typeof monster !== 'string') {
      throw new ArgsError('monster is required');
    }

    if (!hp || typeof hp !== 'number') {
      throw new ArgsError('hp is required');
    }

    const cmd = new CommandMonsterHpLessThan();
    cmd.monster = monster;
    cmd.health = hp;
    window.context.addCommand(cmd);
  },

  monster_in_room(monster: string) {
    if (!monster || typeof monster !== 'string') {
      throw new ArgsError('monster is required');
    }

    const cmd = new CommandMonsterInRoom();
    cmd.monster = monster;
    window.context.addCommand(cmd);
  },
  monster_not_in_room(monster: string) {
    if (!monster || typeof monster !== 'string') {
      throw new ArgsError('monster is required');
    }

    const cmd = new CommandMonsterNotInRoom();
    cmd.monster = monster;
    window.context.addCommand(cmd);
  },
};
