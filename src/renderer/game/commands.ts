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

		queue.addCommand(new LoginCommand(), username, password);
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

		queue.addCommand(new DepositCommand(), item);
	},
	withdraw(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		queue.addCommand(new WithdrawCommand(), item);
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

		queue.addCommand(new SwapCommand(), bankItem, invItem);
	},
};

const combat = {
	attack(monster: string) {
		if (!monster || typeof monster !== 'string') {
			logger.error('monster is required');
			return;
		}

		queue.addCommand(new AttackCommand(), monster);
	},
	kill(monster: string) {
		if (!monster || typeof monster !== 'string') {
			logger.error('monster is required');
			return;
		}

		queue.addCommand(new KillCommand(), monster);
	},
	kill_for_item(monster: string, item: number | string, quantity: number) {
		if (!monster || typeof monster !== 'string') {
			logger.error('monster is required');
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

		queue.addCommand(new KillForCommand(), monster, item, quantity);
	},
	kill_for_temp_item(
		monster: string,
		item: number | string,
		quantity: number,
	) {
		if (!monster || typeof monster !== 'string') {
			logger.error('monster is required');
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

		queue.addCommand(new KillForCommand(), monster, item, quantity, true);
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

		queue.addCommand(new SkillCommand(), skill);
	},
	exit() {
		queue.addCommand(new ExitCommand());
	},
	cancel_target() {
		queue.addCommand(new CancelTargetCommand());
	},
};

const quest = {
	accept(quest: number) {
		if (!quest || typeof quest !== 'number') {
			logger.error('quest is required');
			return;
		}

		queue.addCommand(new AcceptCommand(), quest);
	},
	complete(quest: number) {
		if (!quest || typeof quest !== 'number') {
			logger.error('quest is required');
			return;
		}

		queue.addCommand(new CompleteCommand(), quest);
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

		queue.addCommand(new BuyCommand(), shopId, item, quantity);
	},
	sell_item(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		queue.addCommand(new SellCommand(), item);
	},
};

const world = {
	join(mapName: string, cell = 'Enter', pad = 'Spawn') {
		if (!mapName || typeof mapName !== 'string') {
			logger.error('mapName is required');
			return;
		}

		queue.addCommand(new JoinCommand(), mapName, cell, pad);
	},
	move_to_cell(cell: string, pad = 'Spawn') {
		if (!cell || typeof cell !== 'string') {
			logger.error('cell is required');
			return;
		}

		queue.addCommand(new MoveToCellCommand(), cell, pad);
	},
	set_spawn(cell?: string, pad?: string) {
		queue.addCommand(new SetSpawnCommand(), cell, pad);
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

		queue.addCommand(new WalkToCommand(), x, y);
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

		queue.addCommand(new SetDelayCommand(), delay);
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
		cmd.execute = (msg) => {
			logger.info(msg);
		};

		queue.addCommand(cmd, msg);
	},
};

const misc = {
	label(name: string) {
		if (!name || typeof name !== 'string') {
			logger.error('name is required');
			return;
		}

		queue.addCommand(new LabelCommand(), name);
	},
	goto_label(name: string) {
		if (!name || typeof name !== 'string') {
			logger.error('name is required');
			return;
		}

		queue.addCommand(new GotoLabelCommand(), name);
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
