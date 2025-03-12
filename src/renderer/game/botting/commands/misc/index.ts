import { ArgsError } from '../../ArgsError';
import { CommandDelay } from './CommandDelay';
import { CommandDisableAntiCounter } from './CommandDisableAntiCounter';
import { CommandDisableCollisions } from './CommandDisableCollisions';
import { CommandDisableFx } from './CommandDisableFx';
import { CommandEnableAntiCounter } from './CommandEnableAntiCounter';
import { CommandEnemyMagnet } from './CommandEnemyMagnet';
import { CommandGotoLabel } from './CommandGotoLabel';
import { CommandHidePlayers } from './CommandHidePlayers';
import { CommandInfiniteRange } from './CommandInfiniteRange';
import { CommandLabel } from './CommandLabel';
import { CommandLagKiller } from './CommandLagKiller';
import { CommandLog } from './CommandLog';
import { CommandLogout } from './CommandLogout';
import { CommandProvokeCell } from './CommandProvokeCell';
import { CommandProvokeMap } from './CommandProvokeMap';
import { CommandSetDelay } from './CommandSetDelay';
import { CommandSkipCutscenes } from './CommandSkipCutscenes';
import { CommandStop } from './CommandStop';
import { CommandWaitForPlayerCount } from './CommandWaitForPlayerCount';
import { CommandWalkSpeed } from './CommandWalkSpeed';

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
  // log(msg: string, level?: string) {
  log(msg: string) {
    if (!msg || typeof msg !== 'string') {
      throw new ArgsError('msg is required');
    }

    // if (level && !['info', 'warn', 'error'].includes(level)) {
    //   throw new ArgsError('level must be one of: info, warn, error');
    // }

    const cmd = new CommandLog();
    cmd.msg = msg;
    // cmd.level = level ?? 'info';
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
  enable_collisions() {
    const cmd = new CommandDisableCollisions();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_collisions() {
    const cmd = new CommandDisableCollisions();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_fx() {
    const cmd = new CommandDisableFx();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_fx() {
    const cmd = new CommandDisableFx();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_enemymagnet() {
    const cmd = new CommandEnemyMagnet();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_enemymagnet() {
    const cmd = new CommandEnemyMagnet();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_infiniterange() {
    const cmd = new CommandInfiniteRange();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_infiniterange() {
    const cmd = new CommandInfiniteRange();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_lagkiller() {
    const cmd = new CommandLagKiller();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_lagkiller() {
    const cmd = new CommandLagKiller();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_provokecell() {
    const cmd = new CommandProvokeCell();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_provokecell() {
    const cmd = new CommandProvokeCell();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_provokemap() {
    const cmd = new CommandProvokeMap();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_provokemap() {
    const cmd = new CommandProvokeMap();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_skipcutscenes() {
    const cmd = new CommandSkipCutscenes();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_skipcutscenes() {
    const cmd = new CommandSkipCutscenes();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_hideplayers() {
    const cmd = new CommandHidePlayers();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_hideplayers() {
    const cmd = new CommandHidePlayers();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  set_walk_speed(speed: number) {
    if (typeof speed !== 'number' || speed < 0) {
      throw new ArgsError('speed must be a positive number');
    }

    const cmd = new CommandWalkSpeed();
    cmd.speed = speed;
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
  enable_anticounter() {
    window.context.addCommand(new CommandEnableAntiCounter());
  },
  disable_anticounter() {
    window.context.addCommand(new CommandDisableAntiCounter());
  },
};
