import { ArgsError } from "../../ArgsError";
import { CommandAutoAggro } from "./CommandAutoAggro";
import { CommandBuff } from "./CommandBuff";
import { CommandBuyScrollOfLifeSteal } from "./CommandBuyScrollOfLifeSteal";
import { CommandDelay } from "./CommandDelay";
// import { CommandEquipLoadout } from "./CommandEquipLoadout";
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
import { CommandStartAggroMon } from "./CommandStartAggroMon";
import { CommandStopAggroMon } from "./CommandStopAggroMon";
import { CommandStopBot } from "./CommandStopBot";
import { CommandWaitForPlayerCount } from "./CommandWaitForPlayerCount";
import { CommandWalkSpeed } from "./CommandWalkSpeed";

export const miscCommands = {
  /**
   * Delays command execution for a specified amount of time.
   *
   * @param ms - The delay in milliseconds.
   */
  delay(ms: number) {
    if (!ms || typeof ms !== "number" || ms < 0) {
      throw new ArgsError("ms is required");
    }

    const cmd = new CommandDelay();
    cmd.delay = ms;
    window.context.addCommand(cmd);
  },
  /**
   * Goes to a label in the script.
   *
   * @param label - The name of the label.
   */
  goto_label(label: string) {
    if (!label || typeof label !== "string") {
      throw new ArgsError("label is required");
    }

    const cmd = new CommandGotoLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },
  /**
   * Defines a label in the script.
   *
   * @param label - The name of the label.
   */
  label(label: string) {
    if (!label || typeof label !== "string") {
      throw new ArgsError("label is required");
    }

    const cmd = new CommandLabel();
    cmd.label = label;
    window.context.addCommand(cmd);
  },
  /**
   * Logs a message ingame.
   *
   * @param msg - The message to log.
   */
  log(msg: string) {
    if (!msg || typeof msg !== "string") {
      throw new ArgsError("msg is required");
    }

    const cmd = new CommandLog();
    cmd.msg = msg;
    // cmd.level = level ?? 'info';
    window.context.addCommand(cmd);
  },
  /**
   * Logs out of the game.
   */
  logout() {
    window.context.addCommand(new CommandLogout());
  },
  /**
   * Sets the delay between commands.
   *
   * @param delay - The delay in milliseconds.
   */
  set_delay(delay: number) {
    if ((!delay && delay < 0) || typeof delay !== "number") {
      throw new ArgsError("delay is required");
    }

    const cmd = new CommandSetDelay();
    cmd.delay = Math.trunc(delay);
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Disable collisions" setting.
   */
  enable_collisions() {
    const cmd = new CommandSettingDisableCollisions();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Disable collisions" setting.
   */
  disable_collisions() {
    const cmd = new CommandSettingDisableCollisions();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Disable FX" setting.
   */
  enable_fx() {
    const cmd = new CommandSettingDisableFx();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Disable FX" setting.
   */
  disable_fx() {
    const cmd = new CommandSettingDisableFx();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Enemy magnet" setting.
   */
  enable_enemymagnet() {
    const cmd = new CommandSettingEnemyMagnet();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Enemy magnet" setting.
   */
  disable_enemymagnet() {
    const cmd = new CommandSettingEnemyMagnet();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Infinite range" setting.
   */
  enable_infiniterange() {
    const cmd = new CommandSettingInfiniteRange();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Infinite range" setting.
   */
  disable_infiniterange() {
    const cmd = new CommandSettingInfiniteRange();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Lag killer" setting.
   */
  enable_lagkiller() {
    const cmd = new CommandSettingLagKiller();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Lag killer" setting.
   */
  disable_lagkiller() {
    const cmd = new CommandSettingLagKiller();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Provoke cell" setting.
   */
  enable_provokecell() {
    const cmd = new CommandSettingProvokeCell();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Provoke cell" setting.
   */
  disable_provokecell() {
    const cmd = new CommandSettingProvokeCell();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Provoke map" setting.
   */
  enable_provokemap() {
    const cmd = new CommandSettingProvokeMap();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Provoke map" setting.
   */
  disable_provokemap() {
    const cmd = new CommandSettingProvokeMap();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Skip cutscenes" setting.
   */
  enable_skipcutscenes() {
    const cmd = new CommandSettingSkipCutscenes();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Skip cutscenes" setting.
   */
  disable_skipcutscenes() {
    const cmd = new CommandSettingSkipCutscenes();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Enables the "Hide players" setting.
   */
  enable_hideplayers() {
    const cmd = new CommandSettingHidePlayers();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Hide players" setting.
   */
  disable_hideplayers() {
    const cmd = new CommandSettingHidePlayers();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the walk speed of the player.
   *
   * @param speed - The walk speed (0-100).
   */
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
  /**
   * Stops the bot.
   */
  stop_bot() {
    window.context.addCommand(new CommandStopBot());
  },
  /**
   * Waits for a specified number of players to be in the map.
   *
   * @param count - The number of players to wait for.
   */
  wait_for_player_count(count: number) {
    if (typeof count !== "number" || count < 0) {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandWaitForPlayerCount();
    cmd.count = Math.trunc(count);
    window.context.addCommand(cmd);
  },
  /**
   * Enables the anti-counter attack setting.
   */
  enable_anticounter() {
    const cmd = new CommandSettingAntiCounter();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the anti-counter attack setting.
   */
  disable_anticounter() {
    const cmd = new CommandSettingAntiCounter();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Goes to a player's house.
   *
   * @param player - The name of the player.
   */
  goto_house(player?: string) {
    if (player && typeof player !== "string") {
      throw new ArgsError("player must be a string");
    }

    const cmd = new CommandHouse();
    if (player) cmd.player = player;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the client's locally visible name.
   *
   * @param name - The name of the player.
   */
  set_name(name: string) {
    if (!name || typeof name !== "string") {
      throw new ArgsError("name is required");
    }

    const cmd = new CommandSetName();
    cmd.name = name;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the client's locally visible guild name.
   *
   * @param guild - The name of the guild.
   */
  set_guild(guild: string) {
    if (!guild || typeof guild !== "string") {
      throw new ArgsError("guild is required");
    }

    const cmd = new CommandSetGuild();
    cmd.guild = guild;
    window.context.addCommand(cmd);
  },
  /**
   * Buffs by casting the first 3 skills.
   */
  buff() {
    const cmd = new CommandBuff();
    window.context.addCommand(cmd);
  },
  /**
   * Buys the specified quantity of Scroll of Life Steal.
   *
   * @param qty - The quantity to buy.
   */
  buy_lifesteal(qty: number) {
    if (!qty || typeof qty !== "number" || qty < 0) {
      throw new ArgsError("qty is required");
    }

    const cmd = new CommandBuyScrollOfLifeSteal();
    cmd.qty = Math.trunc(qty);
    window.context.addCommand(cmd);
  },
  // equip_loadout(loadoutName: string) {
  //   if (!loadoutName || typeof loadoutName !== "string") {
  //     throw new ArgsError("loadoutName is required");
  //   }

  //   const cmd = new CommandEquipLoadout();
  //   cmd.loadoutName = loadoutName;
  //   window.context.addCommand(cmd);
  // },
  /**
   * Enables the "Auto Aggro" feature.
   */
  start_autoaggro() {
    const cmd = new CommandAutoAggro();
    cmd.state = true;
    window.context.addCommand(cmd);
  },
  /**
   * Disables the "Auto Aggro" feature.
   */
  stop_autoaggro() {
    const cmd = new CommandAutoAggro();
    cmd.state = false;
    window.context.addCommand(cmd);
  },
  /**
   * Starts aggromon for the specified monsters. This is independent of Provoke setting and Auto Aggro.
   *
   * @param args - The list of monsters.
   */
  start_aggromon(...args: string[]) {
    const monstersList = Array.isArray(args[0]) ? args[0] : args;

    if (
      !monstersList ||
      !Array.isArray(monstersList) ||
      !monstersList?.length
    ) {
      throw new ArgsError("monstersList is required");
    }

    const cmd = new CommandStartAggroMon();
    cmd.monstersList = monstersList;
    window.context.addCommand(cmd);
  },
  /**
   * Stops aggromon.
   */
  stop_aggromon() {
    const cmd = new CommandStopAggroMon();
    window.context.addCommand(cmd);
  },
};
