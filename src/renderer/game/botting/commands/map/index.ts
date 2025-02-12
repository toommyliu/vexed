import { CommandJoinMap } from './CommandJoinMap';
import { CommandMoveToCell } from './CommandMoveToCell';
import { CommandSetSpawnpoint } from './CommandSetSpawnpoint';
import { CommandWalkTo } from './CommandWalkTo';

export const mapCommands = {
	join(map: string, cell = 'Enter', pad = 'Spawn') {
		if (!map || typeof map !== 'string') {
			logger.error('map is required');
			return;
		}

		const cmd = new CommandJoinMap();
		cmd.map = map;
		cmd.cell = cell;
		cmd.pad = pad;
		window.context.addCommand(cmd);
	},
	move_to_cell(cell: string, pad = 'Spawn') {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		const cmd = new CommandMoveToCell();
		cmd.cell = cell;
		cmd.pad = pad;
		window.context.addCommand(cmd);
	},
	set_spawn(cell?: string, pad?: string) {
		const cmd = new CommandSetSpawnpoint();
		if (typeof cell === 'string') {
			cmd.cell = cell;
		}

		if (typeof pad === 'string') {
			cmd.pad = pad;
		}

		window.context.addCommand(cmd);
	},
	walk_to(x: number, y: number) {
		if (!x || typeof x !== 'number') {
			logger.error('x is required');
			return;
		}

		if (!y || typeof y !== 'number') {
			logger.error('y is required');
			return;
		}

		const cmd = new CommandWalkTo();
		cmd.x = x;
		cmd.y = y;
		window.context.addCommand(cmd);
	},
};
