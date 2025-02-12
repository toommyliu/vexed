import { CommandBuy } from './CommandBuy';
import { CommandDeposit } from './CommandDeposit';
import { CommandGetMapItem } from './CommandGetMapItem';
import { CommandPickup } from './CommandPickup';
import { CommandReject } from './CommandReject';
import { CommandSell } from './CommandSell';
import { CommandSwap } from './CommandSwap';
import { CommandWithdraw } from './CommandWithdraw';

export const itemCommands = {
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
		window.context.addCommand(cmd);
	},
	deposit(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandDeposit();
		cmd.item = item;
		window.context.addCommand(cmd);
	},
	get_map_item(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		if (
			typeof item === 'string' &&
			Number.isNaN(Number.parseInt(item, 10))
		) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandGetMapItem();
		cmd.itemId =
			typeof item === 'string' ? Number.parseInt(item, 10) : item;
		window.context.addCommand(cmd);
	},
	pickup(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandPickup();
		cmd.item = item;
		window.context.addCommand(cmd);
	},
	reject(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandReject();
		cmd.item = item;
		window.context.addCommand(cmd);
	},
	sell_item(item: string) {
		if (!item || typeof item !== 'string') {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandSell();
		cmd.item = item;
		window.context.addCommand(cmd);
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
		window.context.addCommand(cmd);
	},
	withdraw(item: number | string) {
		if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
			logger.error('item is required');
			return;
		}

		const cmd = new CommandWithdraw();
		cmd.item = item;
		window.context.addCommand(cmd);
	},
};
