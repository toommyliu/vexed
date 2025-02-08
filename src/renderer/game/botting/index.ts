import { Bot } from '../lib/Bot';
import { LoginCommand, LogoutCommand } from './commands/auth';
import { DepositCommand, SwapCommand, WithdrawCommand } from './commands/bank';
import { SetDelayCommand, StopCommand } from './commands/bot';
import {
	AttackCommand,
	CancelTargetCommand,
	ExitCommand,
	KillCommand,
	KillForCommand,
	RestCommand,
	SkillCommand,
} from './commands/combat';
import { PickupCommand, RejectCommand } from './commands/drops';
import {
	DelayCommand,
	GotoLabelCommand,
	LabelCommand,
	LogCommand,
} from './commands/misc';
// import { CellIsCommand, CellIsNotCommand } from './commands/misc/conditionals';
import {
	AcceptCommand,
	AddCommand,
	CompleteCommand,
	RemoveCommand,
} from './commands/quest';
import { SettingsCommand } from './commands/settings';
import { BuyCommand, SellCommand } from './commands/shop';
import {
	JoinCommand,
	MoveToCellCommand,
	SetSpawnCommand,
	WalkToCommand,
} from './commands/world';
import { Context } from './context';

const { executor } = Bot.getInstance();

export const auth = {
	login(username: string, password: string) {
		if (!username || typeof username !== 'string') {
			logger.error('username is required');
			return;
		}

		if (!password || typeof password !== 'string') {
			logger.error('password is required');
			return;
		}

		const cmd = new LoginCommand();
		cmd.username = username;
		cmd.password = password;
		executor.addCommand(cmd);
	},
	logout() {
		executor.addCommand(new LogoutCommand());
	},
};

export const bank = {
	deposit(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new DepositCommand();
		cmd.item = item;
		executor.addCommand(cmd);
	},
	withdraw(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new WithdrawCommand();
		cmd.item = item;
		executor.addCommand(cmd);
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

		const cmd = new SwapCommand();
		cmd.bankItem = bankItem;
		cmd.invItem = invItem;
		executor.addCommand(cmd);
	},
};

export const combat = {
	attack(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new AttackCommand();
		cmd.target = target;
		executor.addCommand(cmd);
	},
	kill(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new KillCommand();
		cmd.target = target;
		executor.addCommand(cmd);
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

		const cmd = new KillForCommand();
		cmd.target = target;
		cmd.item = item;
		cmd.quantity = quantity;
		executor.addCommand(cmd);
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

		const cmd = new KillForCommand();
		cmd.target = target;
		cmd.item = item;
		cmd.quantity = quantity;
		cmd.isTemp = true;
		executor.addCommand(cmd);
	},
	rest() {
		executor.addCommand(new RestCommand());
	},
	use_skill(skill: number | string) {
		if (
			!skill ||
			(typeof skill !== 'number' && typeof skill !== 'string')
		) {
			logger.error('skill is required');
			return;
		}

		const cmd = new SkillCommand();
		cmd.skill = skill;
		executor.addCommand(cmd);
	},
	exit() {
		executor.addCommand(new ExitCommand());
	},
	cancel_target() {
		executor.addCommand(new CancelTargetCommand());
	},
};

export const drops = {
	pickup(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new PickupCommand();
		cmd.item = item;
		executor.addCommand(cmd);
	},
	reject(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new RejectCommand();
		cmd.item = item;
		executor.addCommand(cmd);
	},
};

export const quest = {
	accept(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new AcceptCommand();
		cmd.questId = questId;
		executor.addCommand(cmd);
	},
	complete(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CompleteCommand();
		cmd.questId = questId;
		executor.addCommand(cmd);
	},
	add(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new AddCommand();
		cmd.questId = questId;
		executor.addCommand(cmd);
	},
	remove(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new RemoveCommand();
		cmd.questId = questId;
		executor.addCommand(cmd);
	},
};

export const shop = {
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

		const cmd = new BuyCommand();
		cmd.shopId = shopId;
		cmd.item = item;
		cmd.quantity = quantity;
		executor.addCommand(cmd);
	},
	sell_item(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new SellCommand();
		cmd.item = item;
		executor.addCommand(cmd);
	},
};

export const world = {
	join(map: string, cell = 'Enter', pad = 'Spawn') {
		if (!map || typeof map !== 'string') {
			logger.error('map is required');
			return;
		}

		const cmd = new JoinCommand();
		cmd.map = map;
		cmd.cell = cell;
		cmd.pad = pad;
		executor.addCommand(cmd);
	},
	move_to_cell(cell: string, pad = 'Spawn') {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		const cmd = new MoveToCellCommand();
		cmd.cell = cell;
		cmd.pad = pad;
		executor.addCommand(cmd);
	},
	set_spawn(cell?: string, pad?: string) {
		const cmd = new SetSpawnCommand();
		if (typeof cell === 'string') {
			cmd.cell = cell;
		}

		if (typeof pad === 'string') {
			cmd.pad = pad;
		}

		executor.addCommand(cmd);
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

		const cmd = new WalkToCommand();
		cmd.x = x;
		cmd.y = y;
		executor.addCommand(cmd);
	},
};

export const bot = {
	start() {
		if (executor.isEmpty) {
			logger.error('queue is empty');
			return;
		}

		logger.info('bot started');
		// eslint-disable-next-line promise/prefer-await-to-then
		void window.context.start().then(() => void executor.start());
	},
	stop() {
		if (executor.isRunning()) {
			// stop immediately
			void executor.stop();
		} else {
			// add a stop command
			executor.addCommand(new StopCommand());
		}

		void window.context.stop();
	},
	set_delay(delay: number) {
		if ((!delay && delay < 0) || typeof delay !== 'number') {
			logger.error('delay is required');
			return;
		}

		const cmd = new SetDelayCommand();
		cmd.delay = delay;
		executor.addCommand(cmd);
	},
	reset() {
		const _bot = Bot.getInstance();
		_bot.executor.setDelay(1_000);
		// @ts-expect-error todo
		_bot.executor._stop();
	},
};

export const settings = {
	enable(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new SettingsCommand();
		cmd.key = option;
		cmd.val = true;
		executor.addCommand(cmd);
	},
	disable(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new SettingsCommand();
		cmd.key = option;
		cmd.val = false;
		executor.addCommand(cmd);
	},
};

export const misc = {
	delay(ms: number) {
		if (!ms || typeof ms !== 'number' || ms < 0) {
			logger.error('ms is required');
			return;
		}

		const cmd = new DelayCommand();
		cmd.delay = ms;
		executor.addCommand(cmd);
	},
	goto_label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new GotoLabelCommand();
		cmd.label = label;
		executor.addCommand(cmd);
	},
	label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new LabelCommand();
		cmd.label = label;
		executor.addCommand(cmd);
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

		const cmd = new LogCommand();
		cmd.msg = msg;
		cmd.level = level ?? 'info';
		executor.addCommand(cmd);
	},
};

// TODO: rethink namespace

// window.is_in_cell = (cell: string) => {
// 	if (!cell || typeof cell !== 'string') {
// 		logger.error('cell is required');
// 		return;
// 	}

// 	const cmd = new CellIsCommand();
// 	cmd.cell = cell;
// 	executor.addCommand(cmd);
// };

// window.is_not_in_cell = (cell: string) => {
// 	if (!cell || typeof cell !== 'string') {
// 		logger.error('cell is required');
// 		return;
// 	}

// 	const cmd = new CellIsNotCommand();
// 	cmd.cell = cell;
// 	executor.addCommand(cmd);
// };

window.auth = auth;
window.bank = bank;
window.bot = bot;
window.combat = combat;
window.drops = drops;
window.world = world;
window.misc = misc;
window.quest = quest;
window.shop = shop;
// window.queue = executor;
window.settings = settings;
window.context = new Context();
