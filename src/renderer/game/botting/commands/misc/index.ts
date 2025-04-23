import { ArgsError } from "../../ArgsError";
import { CommandDelay } from "./CommandDelay";
import { CommandGotoLabel } from "./CommandGotoLabel";
import { CommandHouse } from "./CommandHouse";
import { CommandLabel } from "./CommandLabel";
import { CommandLog } from "./CommandLog";
import { CommandLogout } from "./CommandLogout";
import { CommandSetDelay } from "./CommandSetDelay";
import { CommandSetGuild } from "./CommandSetGuild";
import { CommandSetName } from "./CommandSetName";
import { CommandSettingAntiCounter } from "./CommandSettingAntiCounter";
import { CommandSettingDisableCollisions } from "./CommandSettingDisableCollisions";
import { CommandSettingDisableFx } from "./CommandSettingDisableFx";
import { CommandSettingEnemyMagnet } from "./CommandSettingEnemyMagnet";
import { CommandSettingHidePlayers } from "./CommandSettingHidePlayers";
import { CommandSettingInfiniteRange } from "./CommandSettingInfiniteRange";
import { CommandSettingLagKiller } from "./CommandSettingLagKiller";
import { CommandSettingProvokeCell } from "./CommandSettingProvokeCell";
import { CommandSettingProvokeMap } from "./CommandSettingProvokeMap";
import { CommandSettingSkipCutscenes } from "./CommandSettingSkipCutscenes";
import { CommandStopBot } from "./CommandStopBot";
import { CommandWaitForPlayerCount } from "./CommandWaitForPlayerCount";
import { CommandWalkSpeed } from "./CommandWalkSpeed";

export const miscCommands = {
  delay(ms: number) {
    if (!ms || typeof ms !== "number" || ms < 0) {
      throw new ArgsError("ms is required");
    }

    const cmd = new CommandDelay();
    cmd.delay = ms;
    window.context.addCommand(cmd);
  },
  goto_label(label: string) {
    if (!label || typeof label !== "string") {
      throw new ArgsError("label is required");
    }

    const cmd = new CommandGotoLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },

  label(label: string) {
    if (!label || typeof label !== "string") {
      throw new ArgsError("label is required");
    }

    const cmd = new CommandLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },
  // log(msg: string, level?: string) {
  log(msg: string) {
    if (!msg || typeof msg !== "string") {
      throw new ArgsError("msg is required");
    }

    const cmd = new CommandLog();
    cmd.msg = msg;
    // cmd.level = level ?? 'info';
    window.context.addCommand(cmd);
  },
  logout() {
    window.context.addCommand(new CommandLogout());
  },
  set_delay(delay: number) {
    if ((!delay && delay < 0) || typeof delay !== "number") {
      throw new ArgsError("delay is required");
    }

    const cmd = new CommandSetDelay();
    cmd.delay = Math.trunc(delay);
    window.context.addCommand(cmd);
  },
  enable_collisions() {
    const cmd = new CommandSettingDisableCollisions();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_collisions() {
    const cmd = new CommandSettingDisableCollisions();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_fx() {
    const cmd = new CommandSettingDisableFx();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_fx() {
    const cmd = new CommandSettingDisableFx();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_enemymagnet() {
    const cmd = new CommandSettingEnemyMagnet();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_enemymagnet() {
    const cmd = new CommandSettingEnemyMagnet();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_infiniterange() {
    const cmd = new CommandSettingInfiniteRange();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_infiniterange() {
    const cmd = new CommandSettingInfiniteRange();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_lagkiller() {
    const cmd = new CommandSettingLagKiller();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_lagkiller() {
    const cmd = new CommandSettingLagKiller();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_provokecell() {
    const cmd = new CommandSettingProvokeCell();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_provokecell() {
    const cmd = new CommandSettingProvokeCell();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_provokemap() {
    const cmd = new CommandSettingProvokeMap();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_provokemap() {
    const cmd = new CommandSettingProvokeMap();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_skipcutscenes() {
    const cmd = new CommandSettingSkipCutscenes();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_skipcutscenes() {
    const cmd = new CommandSettingSkipCutscenes();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  enable_hideplayers() {
    const cmd = new CommandSettingHidePlayers();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_hideplayers() {
    const cmd = new CommandSettingHidePlayers();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  set_walk_speed(speed: number) {
    if (typeof speed !== "number" || speed < 0) {
      throw new ArgsError("speed must be a positive number");
    }

    if (speed > 100) {
      throw new ArgsError("speed must be less than or equal to 100");
    }

    const cmd = new CommandWalkSpeed();
    cmd.speed = Math.trunc(speed);
    window.context.addCommand(cmd);
  },
  stop_bot() {
    window.context.addCommand(new CommandStopBot());
  },
  wait_for_player_count(count: number) {
    if (typeof count !== "number" || count < 0) {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandWaitForPlayerCount();
    cmd.count = Math.trunc(count);
    window.context.addCommand(cmd);
  },
  enable_anticounter() {
    const cmd = new CommandSettingAntiCounter();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  disable_anticounter() {
    const cmd = new CommandSettingAntiCounter();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  goto_house(player?: string) {
    if (player || typeof player !== "string") {
      throw new ArgsError("player must be a string");
    }

    const cmd = new CommandHouse();
    if (player) cmd.player = player;
    window.context.addCommand(cmd);
  },
  set_name(name: string) {
    if (!name || typeof name !== "string") {
      throw new ArgsError("name is required");
    }

    const cmd = new CommandSetName();
    cmd.name = name;
    window.context.addCommand(cmd);
  },
  set_guild(guild: string) {
    if (!guild || typeof guild !== "string") {
      throw new ArgsError("guild is required");
    }

    const cmd = new CommandSetGuild();
    cmd.guild = guild;
    window.context.addCommand(cmd);
  },
};
