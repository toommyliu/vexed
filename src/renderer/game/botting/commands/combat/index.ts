import { CommandAttack } from './CommandAttack';
import { CommandCancelTarget } from './CommandCancelTarget';
import { CommandExitCombat } from './CommandExitCombat';
import { CommandKill } from './CommandKill';
import { CommandKillFor } from './CommandKillFor';
import { CommandRest } from './CommandRest';
import { CommandUseSkill } from './CommandUseSkill';

export const combatCommands = {
	attack(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new CommandAttack();
		cmd.target = target;
		window.context.addCommand(cmd);
	},
	cancel_target() {
		window.context.addCommand(new CommandCancelTarget());
	},
	exit_combat() {
		window.context.addCommand(new CommandExitCombat());
	},
	kill(target: string) {
		if (!target || typeof target !== 'string') {
			logger.error('target is required');
			return;
		}

		const cmd = new CommandKill();
		cmd.target = target;
		window.context.addCommand(cmd);
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
		window.context.addCommand(cmd);
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
		window.context.addCommand(cmd);
	},
	rest() {
		window.context.addCommand(new CommandRest());
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
		window.context.addCommand(cmd);
	},
};
