import { ArgsError } from '../../ArgsError';
import { CommandDelay } from './CommandDelay';
import { CommandDisableAntiCounter } from './CommandDisableAntiCounter';
import { CommandEnableAntiCounter } from './CommandEnableAntiCounter';
import { CommandGotoLabel } from './CommandGotoLabel';
import { CommandLabel } from './CommandLabel';
import { CommandLog } from './CommandLog';
// import { CommandLogin } from './login';
import { CommandLogout } from './CommandLogout';
import { CommandSetDelay } from './CommandSetDelay';
import { CommandSetting } from './CommandSetting';
import { CommandStop } from './CommandStop';
import { CommandWaitForPlayerCount } from './CommandWaitForPlayerCount';

export const miscCommands = {
  delay(ms: number) {
    if (!ms || typeof ms !== 'number' || ms < 0) {
      throw new ArgsError('ms is required');
    }

    const cmd = new CommandDelay();
    cmd.delay = ms;
    window.context.addCommand(cmd);
  },
  goto_label(label: string) {
    if (!label || typeof label !== 'string') {
      throw new ArgsError('label is required');
    }

    const cmd = new CommandGotoLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },

  label(label: string) {
    if (!label || typeof label !== 'string') {
      throw new ArgsError('label is required');
    }

    const cmd = new CommandLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },
  log(msg: string, level?: string) {
    if (!msg || typeof msg !== 'string') {
      throw new ArgsError('msg is required');
    }

    if (level && !['info', 'warn', 'error'].includes(level)) {
      throw new ArgsError('level must be one of: info, warn, error');
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
      throw new ArgsError('delay is required');
    }

    const cmd = new CommandSetDelay();
    cmd.delay = delay;
    window.context.addCommand(cmd);
  },
  enable_setting(option: string) {
    if (!option || typeof option !== 'string') {
      throw new ArgsError('option is required');
    }

    const cmd = new CommandSetting();
    cmd.key = option;
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_setting(option: string) {
    if (!option || typeof option !== 'string') {
      throw new ArgsError('option is required');
    }

    const cmd = new CommandSetting();
    cmd.key = option;
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  stop() {
    window.context.addCommand(new CommandStop());
  },
  wait_for_player_count(count: number) {
    if (typeof count !== 'number' || count < 0) {
      throw new ArgsError('count is required');
    }

    const cmd = new CommandWaitForPlayerCount();
    cmd.count = count;
    window.context.addCommand(cmd);
  },
  enable_anti_counter() {
    window.context.addCommand(new CommandEnableAntiCounter());
  },
  disable_anti_counter() {
    window.context.addCommand(new CommandDisableAntiCounter());
  },
};
