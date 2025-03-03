import { CommandCellIs } from './CommandCellIs';
import { CommandCellIsNot } from './CommandCellIsNot';
import { CommandEquipped } from './CommandEquipped';
import { CommandFactionRankGreaterThan } from './CommandFactionRankGreaterThan';
import { CommandFactionRankLessThan } from './CommandFactionRankLessThan';
import { CommandGoldGreaterThan } from './CommandGoldGreaterThan';
import { CommandGoldLessThan } from './CommandGoldLessThan';
import { CommandHasTarget } from './CommandHasTarget';
import { CommandHealthGreaterThan } from './CommandHealthGreaterThan';
import { CommandHealthLessThan } from './CommandHealthLessThan';
import { CommandInBank } from './CommandInBank';
import { CommandInCombat } from './CommandInCombat';
import { CommandInHouse } from './CommandInHouse';
import { CommandNotEquipped } from './CommandNotEquipped';
import { CommandPlayerAuraEquals } from './CommandPlayerAuraEquals';
import { CommandPlayerAurasGreaterThan } from './CommandPlayerAurasGreaterThan';
import { CommandPlayerAurasLessThan } from './CommandPlayerAurasLessThan';
import { CommandPlayerCountGreaterThan } from './CommandPlayerCountGreaterThan';
import { CommandPlayerCountLessThan } from './CommandPlayerCountLessThan';
import { CommandPlayerInMap } from './CommandPlayerInMap';
import { CommandPlayerIsInCell } from './CommandPlayerIsInCell';
import { CommandPlayerIsNotInCell } from './CommandPlayerIsNotInCell';
import { CommandPlayerIsNotInMap } from './CommandPlayerIsNotInMap';
import { CommandQuestCanComplete } from './CommandQuestCanComplete';
import { CommandQuestCanNotComplete } from './CommandQuestCanNotComplete';
import { CommandQuestInProgress } from './CommandQuestInProgress';
import { CommandQuestIsAvailable } from './CommandQuestIsAvailable';
import { CommandQuestIsNotAvailable } from './CommandQuestNotAvailable';
import { CommandQuestNotInProgress } from './CommandQuestNotInProgress';
import { CommandTargetHealthGreaterThan } from './CommandTargetHealthGreaterThan';
import { CommandTargetHealthLessThan } from './CommandTargetHealthLessThan';

export const conditionsCommands = {
  is_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new Error('cell is required');
    }

    const cmd = new CommandCellIs();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  is_not_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new Error('cell is required');
    }

    const cmd = new CommandCellIsNot();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  is_equipped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new Error('item is required');
    }

    const cmd = new CommandEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  is_faction_rank_greater_than(faction: string, rank: number) {
    if (!faction || typeof faction !== 'string') {
      throw new Error('faction is required');
    }

    if (!rank || typeof rank !== 'number') {
      throw new Error('rank is required');
    }

    const cmd = new CommandFactionRankGreaterThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },
  is_faction_rank_less_than(faction: string, rank: number) {
    if (!faction || typeof faction !== 'string') {
      throw new Error('faction is required');
    }

    if (!rank || typeof rank !== 'number') {
      throw new Error('rank is required');
    }

    const cmd = new CommandFactionRankLessThan();
    cmd.faction = faction;
    cmd.rank = rank;
    window.context.addCommand(cmd);
  },

  is_gold_greater_than(gold: number) {
    if (!gold || typeof gold !== 'number') {
      throw new Error('gold amount is required');
    }

    const cmd = new CommandGoldGreaterThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },

  is_gold_less_than(gold: number) {
    if (!gold || typeof gold !== 'number') {
      throw new Error('gold amount is required');
    }

    const cmd = new CommandGoldLessThan();
    cmd.gold = gold;
    window.context.addCommand(cmd);
  },

  has_target() {
    const cmd = new CommandHasTarget();
    window.context.addCommand(cmd);
  },

  is_health_greater_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new Error('hp is required');
    }

    const cmd = new CommandHealthGreaterThan();
    cmd.health = hp;
    window.context.addCommand(cmd);
  },

  is_health_less_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new Error('hp is required');
    }

    const cmd = new CommandHealthLessThan();
    cmd.health = hp;
    window.context.addCommand(cmd);
  },

  is_in_bank(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new Error('item name is required');
    }

    const cmd = new CommandInBank();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  is_in_combat() {
    const cmd = new CommandInCombat();
    window.context.addCommand(cmd);
  },

  is_in_house(item: string, quantity?: number) {
    if (!item || typeof item !== 'string') {
      throw new Error('item name is required');
    }

    const cmd = new CommandInHouse();
    cmd.item = item;
    if (quantity) cmd.qty = quantity;
    window.context.addCommand(cmd);
  },

  not_equipped(item: string) {
    if (!item || typeof item !== 'string') {
      throw new Error('item is required');
    }

    const cmd = new CommandNotEquipped();
    cmd.item = item;
    window.context.addCommand(cmd);
  },

  player_auras_greater_than(aura: string, value: number) {
    if (!aura || typeof aura !== 'string') {
      throw new Error('aura is required');
    }

    if (!value || typeof value !== 'number') {
      throw new Error('value is required');
    }

    const cmd = new CommandPlayerAurasGreaterThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },

  player_auras_less_than(aura: string, value: number) {
    if (!aura || typeof aura !== 'string') {
      throw new Error('aura is required');
    }

    if (!value || typeof value !== 'number') {
      throw new Error('value is required');
    }

    const cmd = new CommandPlayerAurasLessThan();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },

  player_aura_equals(aura: string, value: number) {
    if (!aura || typeof aura !== 'string') {
      throw new Error('aura is required');
    }

    if (!value || typeof value !== 'number') {
      throw new Error('value is required');
    }

    const cmd = new CommandPlayerAuraEquals();
    cmd.aura = aura;
    cmd.value = value;
    window.context.addCommand(cmd);
  },

  player_count_greater_than(count: number) {
    if (!count || typeof count !== 'number') {
      throw new Error('count is required');
    }

    const cmd = new CommandPlayerCountGreaterThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },

  player_count_less_than(count: number) {
    if (!count || typeof count !== 'number') {
      throw new Error('count is required');
    }

    const cmd = new CommandPlayerCountLessThan();
    cmd.count = count;
    window.context.addCommand(cmd);
  },

  is_player_in_map(map: string) {
    if (!map || typeof map !== 'string') {
      throw new Error('map name is required');
    }

    const cmd = new CommandPlayerInMap();
    cmd.name = map;
    window.context.addCommand(cmd);
  },

  is_player_in_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new Error('cell name is required');
    }

    const cmd = new CommandPlayerIsInCell();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  is_player_not_in_map(name: string) {
    if (!name || typeof name !== 'string') {
      throw new Error('player name is required');
    }

    const cmd = new CommandPlayerIsNotInMap();
    cmd.name = name;
    window.context.addCommand(cmd);
  },

  is_player_not_in_cell(cell: string) {
    if (!cell || typeof cell !== 'string') {
      throw new Error('cell name is required');
    }

    const cmd = new CommandPlayerIsNotInCell();
    cmd.cell = cell;
    window.context.addCommand(cmd);
  },

  can_complete_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestCanComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  cannot_complete_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestCanNotComplete();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  is_quest_in_progress(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  is_quest_available(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestIsAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  is_quest_not_available(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestIsNotAvailable();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  is_quest_not_in_progress(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new Error('quest is required');
    }

    const cmd = new CommandQuestNotInProgress();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  target_health_greater_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new Error('hp is required');
    }

    const cmd = new CommandTargetHealthGreaterThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
  target_health_less_than(hp: number) {
    if (!hp || typeof hp !== 'number') {
      throw new Error('hp is required');
    }

    const cmd = new CommandTargetHealthLessThan();
    cmd.hp = hp;
    window.context.addCommand(cmd);
  },
};
