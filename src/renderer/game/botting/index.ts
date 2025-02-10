import {
	CommandAcceptQuest,
	CommandAddQuest,
	CommandAttack,
	CommandBuy,
	CommandCancelTarget,
	CommandCellIs,
	CommandCellIsNot,
	CommandCompleteQuest,
	CommandDelay,
	CommandDeposit,
	CommandExitCombat,
	CommandGetMapItem,
	CommandGotoLabel,
	CommandJoinMap,
	CommandKill,
	CommandKillFor,
	CommandLabel,
	CommandLog,
	CommandLogin,
	CommandLogout,
	CommandMoveToCell,
	CommandPickup,
	CommandReject,
	CommandRemoveQuest,
	CommandRest,
	CommandRestart,
	CommandSell,
	CommandSetDelay,
	CommandSetSpawnpoint,
	CommandSetting,
	CommandStop,
	CommandSwap,
	CommandUseSkill,
	CommandWalkTo,
	CommandWithdraw,
} from './commands';
import { Context } from './context';

const context = new Context();

export const cmd = {
	// auth
	login(username: string, password: string) {
		if (!username || typeof username !== 'string') {
			logger.error('username is required');
			return;
		}

		if (!password || typeof password !== 'string') {
			logger.error('password is required');
			return;
		}

		const cmd = new CommandLogin();
		cmd.username = username;
		cmd.password = password;
		context.addCommand(cmd);
	},
	logout() {
		context.addCommand(new CommandLogout());
	},

	// bank
	deposit(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandDeposit();
		cmd.item = item;
		context.addCommand(cmd);
	},
	withdraw(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandWithdraw();
		cmd.item = item;
		context.addCommand(cmd);
	},
	swap(bankItem: number | string, invItem: number | string) {
		if (
			!bankItem ||
			(typeof bankItem !== 'number' && typeof bankItem !== 'string')
		) {
			logger.error('bankItem is required');
			return;
		}

		if (
			!invItem ||
			(typeof invItem !== 'number' && typeof invItem !== 'string')
		) {
			logger.error('invItem is required');
			return;
		}

		const cmd = new CommandSwap();
		cmd.bankItem = bankItem;
		cmd.invItem = invItem;
		context.addCommand(cmd);
	},

	// combat
	attack(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new CommandAttack();
		cmd.target = target;
		context.addCommand(cmd);
	},
	kill(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new CommandKill();
		cmd.target = target;
		context.addCommand(cmd);
	},
	kill_for_item(target: string, item: number | string, quantity: number) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		if (!quantity || typeof quantity !== 'number' || quantity < 1) {
			logger.error('quantity is required');
			return;
		}

		const cmd = new CommandKillFor();
		cmd.target = target;
		cmd.item = item;
		cmd.quantity = quantity;
		context.addCommand(cmd);
	},
	kill_for_temp_item(
		target: string,
		item: number | string,
		quantity: number,
	) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		if (!quantity || typeof quantity !== 'number') {
			logger.error('quantity is required');
			return;
		}

		const cmd = new CommandKillFor();
		cmd.target = target;
		cmd.item = item;
		cmd.quantity = quantity;
		cmd.isTemp = true;
		context.addCommand(cmd);
	},
	rest() {
		context.addCommand(new CommandRest());
	},
	use_skill(skill: number | string) {
		if (
			!skill ||
			(typeof skill !== 'number' && typeof skill !== 'string')
		) {
			logger.error('skill is required');
			return;
		}

		const cmd = new CommandUseSkill();
		cmd.skill = skill;
		context.addCommand(cmd);
	},
	exit() {
		context.addCommand(new CommandExitCombat());
	},
	cancel_target() {
		context.addCommand(new CommandCancelTarget());
	},

	// drops
	pickup(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandPickup();
		cmd.item = item;
		context.addCommand(cmd);
	},
	reject(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandReject();
		cmd.item = item;
		context.addCommand(cmd);
	},

	// quest
	accept(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CommandAcceptQuest();
		cmd.questId = questId;
		context.addCommand(cmd);
	},
	complete(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CommandCompleteQuest();
		cmd.questId = questId;
		context.addCommand(cmd);
	},
	add(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CommandAddQuest();
		cmd.questId = questId;
		context.addCommand(cmd);
	},
	remove(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CommandRemoveQuest();
		cmd.questId = questId;
		context.addCommand(cmd);
	},

	// shop
	buy_item(shopId: number, item: number | string, quantity: number) {
		if (!shopId || typeof shopId !== 'number') {
			logger.error('shopId is required');
			return;
		}

		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		if (!quantity || typeof quantity !== 'number') {
			logger.error('quantity is required');
			return;
		}

		const cmd = new CommandBuy();
		cmd.shopId = shopId;
		cmd.item = item;
		cmd.quantity = quantity;
		context.addCommand(cmd);
	},
	sell_item(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandSell();
		cmd.item = item;
		context.addCommand(cmd);
	},

	// world
	join(map: string, cell = 'Enter', pad = 'Spawn') {
		if (!map || typeof map !== 'string') {
			logger.error('map is required');
			return;
		}

		const cmd = new CommandJoinMap();
		cmd.map = map;
		cmd.cell = cell;
		cmd.pad = pad;
		context.addCommand(cmd);
	},
	move_to_cell(cell: string, pad = 'Spawn') {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		const cmd = new CommandMoveToCell();
		cmd.cell = cell;
		cmd.pad = pad;
		context.addCommand(cmd);
	},
	set_spawn(cell?: string, pad?: string) {
		const cmd = new CommandSetSpawnpoint();
		if (typeof cell === 'string') {
			cmd.cell = cell;
		}

		if (typeof pad === 'string') {
			cmd.pad = pad;
		}

		context.addCommand(cmd);
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
		context.addCommand(cmd);
	},
	get_map_item(itemId: number) {
		if (!itemId || typeof itemId !== 'number') {
			logger.error('itemId is required');
			return;
		}

		const cmd = new CommandGetMapItem();
		cmd.itemId = itemId;
		context.addCommand(cmd);
	},

	// bot
	start() {
		if (context.isCommandQueueEmpty) {
			logger.error('queue is empty');
			return;
		}

		logger.info('bot started');
		void context.start();
	},
	stop() {
		if (context.isRunning()) {
			// stop checkbox
			void context.stop();
		} else {
			// adding stop command
			context.addCommand(new CommandStop());
		}
	},
	set_delay(delay: number) {
		if ((!delay && delay < 0) || typeof delay !== 'number') {
			logger.error('delay is required');
			return;
		}

		const cmd = new CommandSetDelay();
		cmd.delay = delay;
		context.addCommand(cmd);
	},
	reset() {
		context.setCommandDelay(1_000);
		// @ts-expect-error todo
		context._commands = [];
		// @ts-expect-error todo
		context._commandIndex = 0;
	},

	// settings
	enable(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new CommandSetting();
		cmd.key = option;
		cmd.val = true;
		context.addCommand(cmd);
	},
	disable(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new CommandSetting();
		cmd.key = option;
		cmd.val = false;
		context.addCommand(cmd);
	},

	// misc
	delay(ms: number) {
		if (!ms || typeof ms !== 'number' || ms < 0) {
			logger.error('ms is required');
			return;
		}

		const cmd = new CommandDelay();
		cmd.delay = ms;
		context.addCommand(cmd);
	},
	goto_label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new CommandGotoLabel();
		cmd.label = label;
		context.addCommand(cmd);
	},
	label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new CommandLabel();
		cmd.label = label;
		context.addCommand(cmd);
	},
	log(msg: string, level?: string) {
		if (!msg || typeof msg !== 'string') {
			logger.error('msg is required');
			return;
		}

		if (level && !['info', 'warn', 'error'].includes(level)) {
			logger.error('level must be one of: info, warn, error');
			return;
		}

		const cmd = new CommandLog();
		cmd.msg = msg;
		cmd.level = level ?? 'info';
		context.addCommand(cmd);
	},
};

window.cmd = cmd;
window.context = context;
