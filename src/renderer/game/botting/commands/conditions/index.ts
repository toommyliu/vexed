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
};
