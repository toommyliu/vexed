import { Bot } from './api/Bot';
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
import { Command } from './commands/command';
import { GotoLabelCommand, LabelCommand } from './commands/misc';
import { AcceptCommand, CompleteCommand } from './commands/quest';
import { BuyCommand, SellCommand } from './commands/shop';
import {
	JoinCommand,
	MoveToCellCommand,
	SetSpawnCommand,
	WalkToCommand,
} from './commands/world';

const queue = Bot.getInstance().commandsQueue;

const auth = {
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
		queue.addCommand(cmd);
	},
	logout() {
		queue.addCommand(new LogoutCommand());
	},
};

const bank = {
	deposit(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new DepositCommand();
		cmd.item = item;
		queue.addCommand(cmd);
	},
	withdraw(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new WithdrawCommand();
		cmd.item = item;
		queue.addCommand(cmd);
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
		queue.addCommand(cmd);
	},
};

const combat = {
	attack(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new AttackCommand();
		cmd.target = target;
		queue.addCommand(cmd);
	},
	kill(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new KillCommand();
		cmd.target = target;
		queue.addCommand(cmd);
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
		queue.addCommand(cmd);
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
		queue.addCommand(cmd);
	},
	rest() {
		queue.addCommand(new RestCommand());
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
		queue.addCommand(cmd);
	},
	exit() {
		queue.addCommand(new ExitCommand());
	},
	cancel_target() {
		queue.addCommand(new CancelTargetCommand());
	},
};

const quest = {
	accept(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new AcceptCommand();
		cmd.questId = questId;
		queue.addCommand(cmd);
	},
	complete(questId: number) {
		if (!questId || typeof questId !== 'number') {
			logger.error('questId is required');
			return;
		}

		const cmd = new CompleteCommand();
		cmd.questId = questId;
		queue.addCommand(cmd);
	},
};

const shop = {
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
		queue.addCommand(cmd);
	},
	sell_item(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new SellCommand();
		cmd.item = item;
		queue.addCommand(cmd);
	},
};

const world = {
	join(map: string, cell = 'Enter', pad = 'Spawn') {
		if (!map || typeof map !== 'string') {
			logger.error('map is required');
			return;
		}

		const cmd = new JoinCommand();
		cmd.map = map;
		cmd.cell = cell;
		cmd.pad = pad;
		queue.addCommand(cmd);
	},
	move_to_cell(cell: string, pad = 'Spawn') {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		const cmd = new MoveToCellCommand();
		cmd.cell = cell;
		cmd.pad = pad;
		queue.addCommand(cmd);
	},
	set_spawn(cell?: string, pad?: string) {
		const cmd = new SetSpawnCommand();
		if (typeof cell === 'string') {
			cmd.cell = cell;
		}

		if (typeof pad === 'string') {
			cmd.pad = pad;
		}

		queue.addCommand(cmd);
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
		queue.addCommand(cmd);
	},
};

const bot = {
	start() {
		if (queue.isEmpty) {
			logger.error('queue is empty');
			return;
		}

		logger.info('bot started');
		void queue.start();
	},
	stop() {
		queue.addCommand(new StopCommand());
	},
	set_delay(delay: number) {
		if ((!delay && delay < 0) || typeof delay !== 'number') {
			logger.error('delay is required');
			return;
		}

		const cmd = new SetDelayCommand();
		cmd.delay = delay;
		queue.addCommand(cmd);
	},
	reset() {
		const _bot = Bot.getInstance();
		_bot.commandsQueue.setDelay(1_000);
		// @ts-expect-error todo
		_bot.commandsQueue.commands = [];
	},
	log(msg: string) {
		const cmd = new Command();
		cmd.id = 'bot:log';
		cmd.execute = () => {
			logger.info(msg);
		};

		queue.addCommand(cmd);
	},
};

const misc = {
	label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new LabelCommand();
		cmd.label = label;
		queue.addCommand(cmd);
	},
	goto_label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new GotoLabelCommand();
		cmd.label = label;
		queue.addCommand(cmd);
	},
};

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		auth: typeof auth;
		bank: typeof bank;
		bot: typeof bot;
		combat: typeof combat;
		misc: typeof misc;
		quest: typeof quest;
		queue: typeof queue;
		shop: typeof shop;
		world: typeof world;
	}
}

window.auth = auth;
window.bank = bank;
window.bot = bot;
window.combat = combat;
window.world = world;
window.misc = misc;
window.quest = quest;
window.shop = shop;
window.queue = queue;
