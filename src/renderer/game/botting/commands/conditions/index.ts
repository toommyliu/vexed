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
			logger.error('cell is required');
			return;
		}

		const cmd = new CommandCellIs();
		cmd.cell = cell;
		window.context.addCommand(cmd);
	},

	is_not_cell(cell: string) {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		const cmd = new CommandCellIsNot();
		cmd.cell = cell;
		window.context.addCommand(cmd);
	},

	is_equipped(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandEquipped();
		cmd.item = item;
		window.context.addCommand(cmd);
	},
	is_faction_rank_greater_than(faction: string, rank: number) {
		if (!faction || typeof faction !== 'string') {
			logger.error('faction is required');
			return;
		}

		if (!rank || typeof rank !== 'number') {
			logger.error('rank is required');
			return;
		}

		const cmd = new CommandFactionRankGreaterThan();
		cmd.faction = faction;
		cmd.rank = rank;
		window.context.addCommand(cmd);
	},
	is_faction_rank_less_than(faction: string, rank: number) {
		if (!faction || typeof faction !== 'string') {
			logger.error('faction is required');
			return;
		}

		if (!rank || typeof rank !== 'number') {
			logger.error('rank is required');
			return;
		}

		const cmd = new CommandFactionRankLessThan();
		cmd.faction = faction;
		cmd.rank = rank;
		window.context.addCommand(cmd);
	},

	is_gold_greater_than(gold: number) {
		if (typeof gold !== 'number') {
			logger.error('gold amount is required');
			return;
		}

		const cmd = new CommandGoldGreaterThan();
		cmd.gold = gold;
		window.context.addCommand(cmd);
	},

	is_gold_less_than(gold: number) {
		if (typeof gold !== 'number') {
			logger.error('gold amount is required');
			return;
		}

		const cmd = new CommandGoldLessThan();
		cmd.gold = gold;
		window.context.addCommand(cmd);
	},

	has_target() {
		const cmd = new CommandHasTarget();
		window.context.addCommand(cmd);
	},

	is_health_greater_than(health: number) {
		if (typeof health !== 'number') {
			logger.error('health amount is required');
			return;
		}

		const cmd = new CommandHealthGreaterThan();
		cmd.health = health;
		window.context.addCommand(cmd);
	},

	is_health_less_than(health: number) {
		if (typeof health !== 'number') {
			logger.error('health amount is required');
			return;
		}

		const cmd = new CommandHealthLessThan();
		cmd.health = health;
		window.context.addCommand(cmd);
	},

	is_in_bank(item: string, quantity?: number) {
		if (!item || typeof item !== 'string') {
			logger.error('item name is required');
			return;
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
			logger.error('item name is required');
			return;
		}

		const cmd = new CommandInHouse();
		cmd.item = item;
		if (quantity) cmd.qty = quantity;
		window.context.addCommand(cmd);
	},

	not_equipped(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandNotEquipped();
		cmd.item = item;
		window.context.addCommand(cmd);
	},

	player_auras_greater_than(aura: string, value: number) {
		if (!aura || typeof aura !== 'string') {
			logger.error('aura is required');
			return;
		}

		if (!value || typeof value !== 'number') {
			logger.error('value is required');
			return;
		}

		const cmd = new CommandPlayerAurasGreaterThan();
		cmd.aura = aura;
		cmd.value = value;
		window.context.addCommand(cmd);
	},

	player_auras_less_than(aura: string, value: number) {
		if (!aura || typeof aura !== 'string') {
			logger.error('aura is required');
			return;
		}

		if (!value || typeof value !== 'number') {
			logger.error('value is required');
			return;
		}

		const cmd = new CommandPlayerAurasLessThan();
		cmd.aura = aura;
		cmd.value = value;
		window.context.addCommand(cmd);
	},

	player_aura_equals(aura: string, value: number) {
		if (!aura || typeof aura !== 'string') {
			logger.error('aura is required');
			return;
		}

		if (!value || typeof value !== 'number') {
			logger.error('value is required');
			return;
		}

		const cmd = new CommandPlayerAuraEquals();
		cmd.aura = aura;
		cmd.value = value;
		window.context.addCommand(cmd);
	},

	player_count_greater_than(count: number) {
		if (typeof count !== 'number') {
			logger.error('count is required');
			return;
		}

		const cmd = new CommandPlayerCountGreaterThan();
		cmd.count = count;
		window.context.addCommand(cmd);
	},

	player_count_less_than(count: number) {
		if (typeof count !== 'number') {
			logger.error('count is required');
			return;
		}

		const cmd = new CommandPlayerCountLessThan();
		cmd.count = count;
		window.context.addCommand(cmd);
	},

	is_player_in_map(map: string) {
		if (!map || typeof map !== 'string') {
			logger.error('map name is required');
			return;
		}

		const cmd = new CommandPlayerInMap();
		cmd.map = map;
		window.context.addCommand(cmd);
	},

	is_player_in_cell(cell: string) {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell name is required');
			return;
		}

		const cmd = new CommandPlayerIsInCell();
		cmd.cell = cell;
		window.context.addCommand(cmd);
	},

	is_player_not_in_map(name: string) {
		if (!name || typeof name !== 'string') {
			logger.error('player name is required');
			return;
		}

		const cmd = new CommandPlayerIsNotInMap();
		cmd.name = name;
		window.context.addCommand(cmd);
	},

	is_player_not_in_cell(cell: string) {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell name is required');
			return;
		}

		const cmd = new CommandPlayerIsNotInCell();
		cmd.cell = cell;
		window.context.addCommand(cmd);
	},

	can_complete_quest(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestCanComplete();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	cannot_complete_quest(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestCanNotComplete();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	is_quest_in_progress(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestInProgress();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	is_quest_available(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestIsAvailable();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	is_quest_not_available(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestIsNotAvailable();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	is_quest_not_in_progress(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('quest is required');
			return;
		}

		const cmd = new CommandQuestNotInProgress();
		cmd.questId = questId;
		window.context.addCommand(cmd);
	},

	target_health_greater_than(hp: number) {
		if (typeof hp !== 'number') {
			logger.error('hp is required');
			return;
		}

		const cmd = new CommandTargetHealthGreaterThan();
		cmd.hp = hp;
		window.context.addCommand(cmd);
	},
	target_health_less_than(hp: number) {
		if (typeof hp !== 'number') {
			logger.error('hp is required');
			return;
		}

		const cmd = new CommandTargetHealthLessThan();
		cmd.hp = hp;
		window.context.addCommand(cmd);
	},
};
