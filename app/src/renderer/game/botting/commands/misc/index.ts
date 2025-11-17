import { CommandExecutor } from "@/renderer/game/botting/command-executor";
import { Bot } from "@/renderer/game/lib/Bot";
import { ArgsError } from "@botting/ArgsError";
import { Command } from "@botting/command";
import { CommandRegistry } from "@botting/command-registry";
import { CommandAutoRelogin } from "./CommandAutoRelogin";
import { CommandAutoZoneAstralShrine } from "./CommandAutoZoneAstralShrine";
import { CommandAutoZoneDarkCarnax } from "./CommandAutoZoneDarkCarnax";
import { CommandAutoZoneLedgermayne } from "./CommandAutoZoneLedgermayne";
import { CommandAutoZoneMoreSkulls } from "./CommandAutoZoneMoreSkulls";
import { CommandAutoZoneQueenIona } from "./CommandAutoZoneQueenIona";
import { CommandAutoZoneUltraDage } from "./CommandAutoZoneUltraDage";
import { CommandBeep } from "./CommandBeep";
import { CommandBuff } from "./CommandBuff";
import { CommandBuyScrollOfEnrage } from "./CommandBuyScrollOfEnrage";
import { CommandBuyScrollOfLifeSteal } from "./CommandBuyScrollOfLifeSteal";
import { CommandCloseWindow } from "./CommandCloseWindow";
import { CommandDelay } from "./CommandDelay";
// import { CommandEquipLoadout } from "./CommandEquipLoadout";
import { CommandDoWheelOfDoom } from "./CommandDoWheelOfDoom";
import { CommandDrinkConsumables } from "./CommandDrinkConsumables";
import { CommandGotoLabel } from "./CommandGotoLabel";
import { CommandGotoPlayer } from "./CommandGotoPlayer";
import { CommandHouse } from "./CommandHouse";
import { CommandLabel } from "./CommandLabel";
import { CommandLog } from "./CommandLog";
import { CommandLogout } from "./CommandLogout";
import {
  CommandLoopTaunt,
  SimpleStrategy,
  MessageStrategy,
  type StrategyInput,
  type ITauntStrategy,
} from "./CommandLoopTaunt";
import { CommandRegisterTask } from "./CommandRegisterTask";
import { CommandSetAutoRegisterRequirements } from "./CommandSetAutoRegisterRequirements";
import { CommandSetAutoRegisterRewards } from "./CommandSetAutoRegisterRewards";
import { CommandSetDelay } from "./CommandSetDelay";
import { CommandSetFPS } from "./CommandSetFPS";
import { CommandSetGuild } from "./CommandSetGuild";
import { CommandSetName } from "./CommandSetName";
import { CommandSetRejectElse } from "./CommandSetRejectElse";
import { CommandSettingAntiCounter } from "./CommandSettingAntiCounter";
import { CommandSettingDisableCollisions } from "./CommandSettingDisableCollisions";
import { CommandSettingDisableFx } from "./CommandSettingDisableFx";
import { CommandSettingEnemyMagnet } from "./CommandSettingEnemyMagnet";
import { CommandSettingHidePlayers } from "./CommandSettingHidePlayers";
import { CommandSettingInfiniteRange } from "./CommandSettingInfiniteRange";
import { CommandSettingLagKiller } from "./CommandSettingLagKiller";
import { CommandSettingProvokeCell } from "./CommandSettingProvokeCell";
import { CommandSettingSkipCutscenes } from "./CommandSettingSkipCutscenes";
import { CommandStopBot } from "./CommandStopBot";
import { CommandUnregisterTask } from "./CommandUnregisterTask";
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
   * Waits for a specific number of players to be in the map.
   *
   * @param count - The number of players to wait for.
   * @param exact - Whether to wait for the exact number of players.
   */
  wait_for_player_count(count: number, exact = false) {
    if (typeof count !== "number" || count < 0) {
      throw new ArgsError("count is required");
    }

    const cmd = new CommandWaitForPlayerCount();
    cmd.count = Math.trunc(count);
    cmd.exact = exact;
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
   * Buffs by casting the first 3 skills, or the provided skill set.
   *
   * @param skillList - The optional skill set to use for buffing. Set to null to use the default skill set (1, 2, 3).
   * @param wait - Whether to wait for a skill to be ready before going to the next one.
   */
  buff(skillList: number[] = [1, 2, 3], wait = false) {
    if (skillList && !Array.isArray(skillList)) {
      throw new ArgsError("skillList is required");
    }

    if (typeof wait !== "boolean") {
      throw new ArgsError("wait is required");
    }

    const cmd = new CommandBuff();
    cmd.skills = skillList ?? [];
    cmd.wait = wait;
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
  register_command(
    name: string,
    // cmdFactory should return a Command constructor (a class), not an instance
    cmdFactory: (CommandClass: typeof Command) => typeof Command,
  ) {
    if (!name || typeof name !== "string") {
      throw new ArgsError("command name is required");
    }

    const commandRegistry = CommandRegistry.getInstance();

    const _name = name.toLowerCase();

    // don't allow built-ins to be overwritten
    if (commandRegistry.commands.has(_name)) {
      throw new ArgsError("built-in commands cannot be overwritten");
    }

    const cls = cmdFactory(Command);

    if (typeof cls !== "function") {
      throw new ArgsError("cmdFactory must return a Command constructor (class)");
    }

    if (!(cls.prototype instanceof Command)) {
      throw new ArgsError("cmdFactory must return a class that extends Command");
    }

    if (!Object.hasOwn(cls.prototype, "executeImpl") || typeof (cls.prototype as any).executeImpl !== "function") {
      throw new ArgsError("command must implement executeImpl()");
    }

    if (!Object.hasOwn(cls.prototype, "toString") || typeof cls.prototype.toString !== "function") {
      throw new ArgsError("command must implement toString()");
    }

    if (Object.hasOwn(cls.prototype, "execute")) {
      throw new ArgsError("command must not override execute()");
    }

    commandRegistry.registerCustomCommand(_name, () => {});

    Object.defineProperty(window.cmd, _name, {
      value(...args: unknown[]) {
        const newCmd = new (cls as new () => Command)();
        Object.defineProperty(newCmd, "args", { value: args });
        window.context.addCommand(newCmd);
      },
    });
  },
  unregister_command(name: string) {
    if (!name || typeof name !== "string") {
      throw new Error("command name is required");
    }

    const commandRegistry = CommandRegistry.getInstance();
    const _name = name.toLowerCase();
    if (!commandRegistry.customCommands.has(_name)) return;

    commandRegistry.unregisterCommand(_name);

    if (_name in window.cmd && typeof window.cmd?.[_name] === "function") {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete window.cmd[_name];
    }
  },
  /**
   * Registers a packet handler.
   *
   * @param type - "packetFromClient" | "packetFromServer" | "pext"
   * @param name - The name of the handler.
   * @param handler - The handler function. For "pext", the function receives a parsed object. For "packetFromClient" and "packetFromServer", the function receives a raw string.
   */
  register_handler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
    handler:
      | ((packet: Record<string, unknown>) => Promise<void> | void)
      | ((packet: string) => Promise<void> | void),
  ) {
    if (
      !type ||
      !["pext", "packetFromServer", "packetFromClient"].includes(type)
    ) {
      throw new ArgsError("handler type is required");
    }

    if (!name || typeof name !== "string") {
      throw new ArgsError("handler name is required");
    }

    if (!handler || typeof handler !== "function") {
      throw new ArgsError("handler is required");
    }

    const context = CommandExecutor.getInstance();
    const _name = name.toLowerCase();

    if (type === "pext") {
      context.registerHandler(
        "pext",
        _name,
        handler as (packet: Record<string, unknown>) => Promise<void> | void,
      );
    } else if (type === "packetFromServer") {
      context.registerHandler(
        "packetFromServer",
        _name,
        handler as (packet: string) => Promise<void> | void,
      );
    } else if (type === "packetFromClient") {
      context.registerHandler(
        "packetFromClient",
        _name,
        handler as (packet: string) => Promise<void> | void,
      );
    }
  },
  unregister_handler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
  ) {
    if (
      !type ||
      !["pext", "packetFromServer", "packetFromClient"].includes(type)
    ) {
      throw new ArgsError("handler type is required");
    }

    if (!name || typeof name !== "string") {
      throw new ArgsError("handler name is required");
    }

    const context = CommandExecutor.getInstance();
    const _name = name.toLowerCase();

    if (type === "pext") {
      context.unregisterHandler("pext", _name);
    } else if (type === "packetFromServer") {
      context.unregisterHandler("packetFromServer", _name);
    } else if (type === "packetFromClient") {
      context.unregisterHandler("packetFromClient", _name);
    }
  },
  /**
   * Goes to a player.
   *
   * @param player - The name of the player.
   */
  goto_player(player: string) {
    if (!player || typeof player !== "string") {
      throw new ArgsError("player is required");
    }

    const cmd = new CommandGotoPlayer();
    cmd.playerName = player;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the target FPS for the game.
   *
   * @param fps - The desired value.
   */
  set_fps(fps: number) {
    if (!fps || typeof fps !== "number" || fps < 0) {
      throw new ArgsError("fps is required");
    }

    const cmd = new CommandSetFPS();
    cmd.fps = Math.trunc(fps);
    window.context.addCommand(cmd);
  },
  buy_scroll_of_enrage(qty: number) {
    if (!qty || typeof qty !== "number" || qty < 0) {
      throw new ArgsError("qty is required");
    }

    const cmd = new CommandBuyScrollOfEnrage();
    cmd.qty = Math.min(Math.trunc(qty), 1_000);
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for ledgermayne map.
   */
  use_autozone_ledgermayne() {
    const cmd = new CommandAutoZoneLedgermayne();
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for moreskulls map.
   */
  use_autozone_moreskulls() {
    const cmd = new CommandAutoZoneMoreSkulls();
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for darkcarnax map.
   */
  use_autozone_darkcarnax() {
    const cmd = new CommandAutoZoneDarkCarnax();
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for ultradage map.
   */
  use_autozone_ultradage() {
    const cmd = new CommandAutoZoneUltraDage();
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for astralshrine map.
   */
  use_autozone_astralshrine() {
    const cmd = new CommandAutoZoneAstralShrine();
    window.context.addCommand(cmd);
  },
  /**
   * Enables auto-zoning for queeniona map.
   */
  use_autozone_queeniona() {
    const cmd = new CommandAutoZoneQueenIona();
    window.context.addCommand(cmd);
  },
  /**
   * Closes the window.
   */
  close_window() {
    const cmd = new CommandCloseWindow();
    window.context.addCommand(cmd);
  },
  /**
   * Beeps the specified number of times.
   *
   * @param times - How many times to beep.
   */
  beep(times?: number) {
    const cmd = new CommandBeep();
    cmd.times = 1;
    if (times) {
      if (typeof times !== "number") throw new ArgsError("times is required");

      cmd.times = Math.trunc(times);
      if (cmd.times < 1) cmd.times = 1;
    }

    window.context.addCommand(cmd);
  },
  /**
   * Sets the credentials to use for Auto Relogin.
   * After a login attempt, the client stores the username and password used to log in, regardless if successful. These fields are re-used
   * when null(s) are passed.
   *
   * @example
   * cmd.use_autorelogin(null, null, 'Twig') // uses the current username and password, but sets the server to Twig
   * cmd.use_autorelogin('myusername', 'mypassword', null) // uses the current server, but sets the username and password
   * @param username - The username of the account. If set to null, the current username (as shown to the bot) will be used.
   * @param password - The password of the account. If set to null, the current password (as shown to the bot) will be used.
   * @param server - The server to log into. If set to null, the current server will be used.
   */
  use_autorelogin(
    username: string | null,
    password: string | null,
    server: string | null,
  ) {
    const cmd = new CommandAutoRelogin();
    if (username) cmd.username = username;
    if (password) cmd.password = password;
    if (server) cmd.server = server;

    window.context.addCommand(cmd);
  },
  /**
   * Registers a task (a.k.a background job) to be executed alongside commands.
   * The task function is bound to an object containing the bot instance and the context instance.
   *
   * @example
   * ```js
   * cmd.register_task('walkToPoint', function () {
   *   let intervalId = setInterval(() => {
   *     if (!this.ctx.isRunning()) {
   *       clearInterval(intervalId)
   *       return
   *     }
   *     if (this.bot.world.name !== 'ultraspeaker') return
   *     this.bot.player.walkTo(28, 235) // top left
   *   }, 100)
   * })
   * ```
   * @param name - The name of the task.
   * @param taskFn - The async function to run as the task.
   */
  register_task(name: string, taskFn: () => Promise<void>) {
    if (!name || typeof name !== "string") {
      throw new ArgsError("name is required");
    }

    if (!taskFn || typeof taskFn !== "function") {
      throw new ArgsError("taskFn is required");
    }

    if (window.context.hasTask(name)) {
      throw new ArgsError(
        `a task with the name '${name}' is already registered`,
      );
    }

    const cmd = new CommandRegisterTask();
    cmd.name = name;
    cmd.taskFn = taskFn.bind({
      bot: Bot.getInstance(),
      ctx: window.context,
    });
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters a previously registered task.
   *
   * @param name - The name of the task to unregister.
   */
  unregister_task(name: string) {
    if (!name || typeof name !== "string") {
      throw new ArgsError("name is required");
    }

    const cmd = new CommandUnregisterTask();
    cmd.name = name;
    window.context.addCommand(cmd);
  },
  /**
   * Performs loop taunt based on one or more strategies. See [looptaunt guide](/guides/looptaunt) for more details.
   *
   * @param strategies - An array of strategies. Each strategy is an array of [target, playerIndex, maxPlayers, (msg)]. msg is optional if using Simple mode.
   */
  do_looptaunt(
    ...strategies: [string, number, number, string?][] /* expanded for docgen */
  ) {
    const cmd = new CommandLoopTaunt();
    const strategyArr: StrategyInput[] =
      strategies as unknown as StrategyInput[];
    const strategyInstances: ITauntStrategy[] = [];

    for (const strategyInput of strategyArr) {
      if (!Array.isArray(strategyInput) || strategyInput.length < 3)
        throw new ArgsError(
          'expected ["target", playerIndex, maxPlayers, (msg)]',
        );

      const [target, playerIndex, maxPlayers, msg] = strategyInput;

      if (typeof playerIndex !== "number" || playerIndex <= 0)
        throw new ArgsError(`playerIndex is required`);

      if (typeof maxPlayers !== "number" || maxPlayers <= 0)
        throw new ArgsError(`maxPlayers is required`);

      if (!target || typeof target !== "string")
        throw new ArgsError(`target is required`);

      let strategy: ITauntStrategy;

      if (msg && typeof msg === "string")
        strategy = new MessageStrategy(playerIndex, maxPlayers, target, msg);
      else strategy = new SimpleStrategy(playerIndex, maxPlayers, target);

      strategyInstances.push(strategy);
    }

    if (strategyInstances.length === 0)
      throw new ArgsError("at least one strategy is required");

    cmd.originalStrategies = strategyArr;
    cmd.strategyInstances = strategyInstances;
    window.context.addCommand(cmd);
  },
  /**
   * Drinks consumable items.
   *
   * @param items - The name(s) of the items.
   * @param equipAfter - The name of the item to equip after drinking consumables.
   */
  drink_consumables(items: string[] | string, equipAfter?: string) {
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length === 0 || arr.some((item) => typeof item !== "string")) {
      throw new ArgsError("items is required");
    }

    if (equipAfter && typeof equipAfter !== "string") {
      throw new ArgsError("equipAfter is required");
    }

    const cmd = new CommandDrinkConsumables();
    cmd.items = arr;
    if (equipAfter) cmd.equipAfter = equipAfter;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the rejectElse flag for the Environment.
   *
   * @param val - The value to set.
   */
  set_reject_else(val: boolean) {
    if (typeof val !== "boolean") {
      throw new ArgsError("rejectElse is required");
    }

    const cmd = new CommandSetRejectElse();
    cmd.val = val;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the auto register requirements flag for the Environment.
   *
   * @param val - The value to set.
   */
  set_auto_register_requirements(val: boolean) {
    if (typeof val !== "boolean") {
      throw new ArgsError("autoRegisterRequirements is required");
    }

    const cmd = new CommandSetAutoRegisterRequirements();
    cmd.val = val;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the auto register rewards flag for the Environment.
   *
   * @param val - The value to set.
   */
  set_auto_register_rewards(val: boolean) {
    if (typeof val !== "boolean") {
      throw new ArgsError("autoRegisterRewards is required");
    }

    const cmd = new CommandSetAutoRegisterRewards();
    cmd.val = val;
    window.context.addCommand(cmd);
  },
  /**
   * Does the Wheel of Doom spin (non-members).
   * 
   * @param to_bank - Whether to put the reward in the bank.
   */
  do_wheelofdoom(to_bank: boolean = false) {
    if (typeof to_bank !== "boolean") {
      throw new ArgsError("to_bank must be a boolean");
    }

    const cmd = new CommandDoWheelOfDoom();
    cmd.bank = to_bank;
    window.context.addCommand(cmd);
  }
};
