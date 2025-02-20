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
			throw new Error('ms is required');
		}

		const cmd = new CommandDelay();
		cmd.delay = ms;
		window.context.addCommand(cmd);
	},
	goto_label(label: string) {
		if (!label || typeof label !== 'string') {
			throw new Error('label is required');
		}

		const cmd = new CommandGotoLabel();
		cmd.label = label;
		window.context.addCommand(cmd);
	},

	label(label: string) {
		if (!label || typeof label !== 'string') {
			throw new Error('label is required');
		}

		const cmd = new CommandLabel();
		cmd.label = label;
		window.context.addCommand(cmd);
	},
	log(msg: string, level?: string) {
		if (!msg || typeof msg !== 'string') {
			throw new Error('msg is required');
		}

		if (level && !['info', 'warn', 'error'].includes(level)) {
			throw new Error('level must be one of: info, warn, error');
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
			throw new Error('delay is required');
		}

		const cmd = new CommandSetDelay();
		cmd.delay = delay;
		window.context.addCommand(cmd);
	},
	enable_setting(option: string) {
		if (!option || typeof option !== 'string') {
			throw new Error('option is required');
		}

		const cmd = new CommandSetting();
		cmd.key = option;
		cmd.state = true;
		window.context.addCommand(cmd);
	},
	disable_setting(option: string) {
		if (!option || typeof option !== 'string') {
			throw new Error('option is required');
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
