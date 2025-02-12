import { CommandDelay } from './CommandDelay';
import { CommandGotoLabel } from './CommandGotoLabel';
import { CommandLabel } from './CommandLabel';
import { CommandLog } from './CommandLog';
// import { CommandLogin } from './login';
import { CommandLogout } from './CommandLogout';
import { CommandSetDelay } from './CommandSetDelay';
import { CommandSetting } from './CommandSetting';
import { CommandStop } from './CommandStop';

export const miscCommands = {
	delay(ms: number) {
		if (!ms || typeof ms !== 'number' || ms < 0) {
			logger.error('ms is required');
			return;
		}

		const cmd = new CommandDelay();
		cmd.delay = ms;
		window.context.addCommand(cmd);
	},
	goto_label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new CommandGotoLabel();
		cmd.label = label;
		window.context.addCommand(cmd);
	},

	label(label: string) {
		if (!label || typeof label !== 'string') {
			logger.error('label is required');
			return;
		}

		const cmd = new CommandLabel();
		cmd.label = label;
		window.context.addCommand(cmd);
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
		window.context.addCommand(cmd);
	},
	logout() {
		window.context.addCommand(new CommandLogout());
	},
	set_delay(delay: number) {
		if ((!delay && delay < 0) || typeof delay !== 'number') {
			logger.error('delay is required');
			return;
		}

		const cmd = new CommandSetDelay();
		cmd.delay = delay;
		window.context.addCommand(cmd);
	},
	enable_setting(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new CommandSetting();
		cmd.key = option;
		cmd.state = true;
		window.context.addCommand(cmd);
	},
	disable_setting(option: string) {
		if (!option || typeof option !== 'string') {
			logger.error('option is required');
			return;
		}

		const cmd = new CommandSetting();
		cmd.key = option;
		cmd.state = false;
		window.context.addCommand(cmd);
	},
	stop() {
		window.context.addCommand(new CommandStop());
	},
	reset() {
		window.context.setCommandDelay(1_000);
		// @ts-expect-error todo
		window.context._commands = [];
		// @ts-expect-error todo
		window.context._commandIndex = 0;
	},
};
