import type { ScriptCommandName } from "./Commands";
import type { ScriptInstruction } from "./Types";

const MAX_VALUE_LENGTH = 72;
const MAX_ARGS_LENGTH = 120;
const MAX_LABEL_LENGTH = 180;

type CommandDisplayFormatter = (args: ReadonlyArray<unknown>) => string;

export interface ScriptCommandDisplayItem {
  readonly index: number;
  readonly name: string;
  readonly label: string;
  readonly argsText: string;
}

const truncate = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;

const formatString = (value: string): string => {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")
    .replaceAll('"', '\\"');
  return `"${truncate(escaped, MAX_VALUE_LENGTH)}"`;
};

const formatRecord = (value: Readonly<Record<string, unknown>>): string => {
  const entries = Object.entries(value);
  const preview = entries
    .slice(0, 3)
    .map(([key, entryValue]) => `${key}: ${formatArgument(entryValue)}`)
    .join(", ");
  return `{${preview}${entries.length > 3 ? ", ..." : ""}}`;
};

export const formatArgument = (value: unknown): string => {
  if (typeof value === "string") {
    return formatString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return String(value);
  }

  if (typeof value === "function") {
    return "fn";
  }

  if (Array.isArray(value)) {
    const preview = value.slice(0, 4).map(formatArgument).join(", ");
    return `[${preview}${value.length > 4 ? ", ..." : ""}]`;
  }

  if (typeof value === "object") {
    return formatRecord(value as Readonly<Record<string, unknown>>);
  }

  return truncate(String(value), MAX_VALUE_LENGTH);
};

export const formatInstructionArgs = (
  args: ReadonlyArray<unknown>,
): string => {
  if (args.length === 0) {
    return "";
  }

  return truncate(args.map(formatArgument).join(", "), MAX_ARGS_LENGTH);
};

const valueText = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return formatArgument(value);
};

const optionText = (
  value: unknown,
  key: string,
): string | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const optionValue = (value as Readonly<Record<string, unknown>>)[key];
  const text = valueText(optionValue);
  return text.length > 0 ? text : undefined;
};

const bracket = (value: string | undefined): string =>
  value && value.length > 0 ? ` [${value}]` : "";

const cellPadText = (cell: unknown, pad: unknown): string | undefined => {
  const cellText = valueText(cell);
  if (!cellText) {
    return undefined;
  }

  const padText = valueText(pad);
  return padText ? `${cellText}:${padText}` : cellText;
};

const sentenceCaseCommandName = (name: string): string =>
  name
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());

const conditionOperatorText = (operator: unknown): string => {
  switch (operator) {
    case "eq":
      return "==";
    case "ne":
      return "!=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    default:
      return valueText(operator);
  }
};

const conditionMetricText = (metric: unknown): string =>
  valueText(metric).replaceAll("_", " ");

const isConditionRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatCondition = (value: unknown): string => {
  if (!isConditionRecord(value) || typeof value["_tag"] !== "string") {
    return formatArgument(value);
  }

  const tag = value["_tag"];
  switch (tag) {
    case "All":
      return `AND(${Array.isArray(value["conditions"]) ? value["conditions"].map(formatCondition).join(", ") : ""})`;
    case "Any":
      return `OR(${Array.isArray(value["conditions"]) ? value["conditions"].map(formatCondition).join(" || ") : ""})`;
    case "Not":
      return `NOT(${formatCondition(value["condition"])})`;
    case "Custom": {
      const args = Array.isArray(value["args"])
        ? formatInstructionArgs(value["args"])
        : "";
      return `Custom condition: ${valueText(value["name"])}${args ? `(${args})` : ""}`;
    }
    case "PlayerMetric":
      return `Player ${conditionMetricText(value["metric"])} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "SelfNumberMetric":
      return `${sentenceCaseCommandName(conditionMetricText(value["metric"]))} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "PlayerNamedMetric":
      return `Player ${valueText(value["player"]) || "self"} ${conditionMetricText(value["metric"])} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "AnyPlayerMetric":
      return `Any player ${conditionMetricText(value["metric"])} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "PlayerAuraPresence":
      return `Player ${valueText(value["player"]) || "self"} has aura: ${valueText(value["aura"])}`;
    case "PlayerAuraMetric":
      return `Player ${valueText(value["player"]) || "self"} aura ${valueText(value["aura"])} ${conditionMetricText(value["metric"])} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "PlayerCount":
      return `Player count${value["cell"] ? ` in ${valueText(value["cell"])}` : ""} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "MonsterMetric":
      return `Monster ${valueText(value["target"])} ${conditionMetricText(value["metric"])} ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "MonsterPresence":
      return `Monster ${valueText(value["monster"])} ${value["expected"] === false ? "not in room" : "in room"}`;
    case "InventoryContains":
      return `${sentenceCaseCommandName(valueText(value["location"]))} ${value["expected"] === false ? "does not contain" : "contains"}: ${valueText(value["item"])} x${valueText(value["quantity"])}`;
    case "ItemState":
      return `Item ${valueText(value["item"])} ${value["expected"] === false ? "not " : ""}${conditionMetricText(value["state"])}${value["quantity"] ? ` x${valueText(value["quantity"])}` : ""}`;
    case "BooleanState":
      return `${sentenceCaseCommandName(conditionMetricText(value["state"]))}: ${value["expected"] === false ? "false" : "true"}`;
    case "ArmyState":
      return value["state"] === "player_number"
        ? `Army player number is ${valueText(value["playerNumber"])}`
        : `Army ${conditionMetricText(value["state"])}: ${value["expected"] === false ? "false" : "true"}`;
    case "Cell":
      return `Cell ${value["expected"] === false ? "is not" : "is"}: ${valueText(value["cell"])}`;
    case "Map":
      return `Map ${value["expected"] === false ? "is not" : "is"}: ${valueText(value["map"])}`;
    case "PlayerLocation":
      return `Player ${valueText(value["player"])} ${value["expected"] === false ? "not in" : "in"} ${valueText(value["cell"]) || "map"}`;
    case "PlayerName":
      return `Player name ${value["expected"] === false ? "is not" : "is"}: ${valueText(value["player"])}`;
    case "FactionRank":
      return `Faction ${valueText(value["faction"])} rank ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "ClassRank":
      return `Class ${valueText(value["className"])} rank ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`;
    case "QuestState":
      return `Quest ${valueText(value["questId"])} ${conditionMetricText(value["state"])}: ${value["expected"] === false ? "false" : "true"}`;
    case "TargetHp":
      return value["upper"] === undefined
        ? `Target HP ${conditionOperatorText(value["operator"])} ${valueText(value["value"])}`
        : `Target HP between ${valueText(value["value"])} and ${valueText(value["upper"])}`;
    default:
      return formatRecord(value);
  }
};

const commandDisplayFormatters = {
  in_cell: ([cell]) => `Cell is: ${valueText(cell)}`,
  not_in_cell: ([cell]) => `Cell is not: ${valueText(cell)}`,
  equipped: ([item]) => `Is equipped: ${valueText(item)}`,
  not_equipped: ([item]) => `Is not equipped: ${valueText(item)}`,
  has_target: () => "Has target",
  has_no_target: () => "Does not have target",
  in_inventory: ([item, quantity]) =>
    `In inventory: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  not_in_inventory: ([item, quantity]) =>
    `Not in inventory: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  in_tempinventory: ([item, quantity]) =>
    `In temp: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  not_in_tempinventory: ([item, quantity]) =>
    `Not in temp: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  in_bank: ([item, quantity]) =>
    `In bank: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  not_in_bank: ([item, quantity]) =>
    `Not in bank: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  in_combat: () => "In combat",
  not_in_combat: () => "Not in combat",
  in_house: ([item, quantity]) =>
    `In house: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  not_in_house: ([item, quantity]) =>
    `Not in house: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,
  is_member: () => "Is member",
  is_not_member: () => "Is not member",
  player_in_map: ([player]) => `Player in map: ${valueText(player)}`,
  player_in_cell: ([player, cell]) =>
    `Player in cell: ${valueText(player)} [${valueText(cell)}]`,
  player_not_in_map: ([player]) => `Player not in map: ${valueText(player)}`,
  player_not_in_cell: ([player, cell]) =>
    `Player not in cell: ${valueText(player)} [${valueText(cell)}]`,
  player_name_equals: ([player]) => `Player name is: ${valueText(player)}`,
  can_complete_quest: ([questId]) =>
    `Quest can complete: ${valueText(questId)}`,
  cannot_complete_quest: ([questId]) =>
    `Quest cannot complete: ${valueText(questId)}`,
  quest_in_progress: ([questId]) =>
    `Quest in progress: ${valueText(questId)}`,
  quest_not_in_progress: ([questId]) =>
    `Quest not in progress: ${valueText(questId)}`,
  quest_is_available: ([questId]) =>
    `Quest is available: ${valueText(questId)}`,
  quest_not_available: ([questId]) =>
    `Quest not available: ${valueText(questId)}`,
  is_maxed: ([item]) => `Is max stack: ${valueText(item)}`,
  is_not_maxed: ([item]) => `Is not max stack: ${valueText(item)}`,
  item_has_dropped: ([item]) => `Item has dropped: ${valueText(item)}`,
  item_has_not_dropped: ([item]) =>
    `Item has not dropped: ${valueText(item)}`,
  in_map: ([map]) => `Map is: ${valueText(map)}`,
  not_in_map: ([map]) => `Map is not: ${valueText(map)}`,
  monster_in_room: ([monster]) => `Monster in room: ${valueText(monster)}`,
  monster_not_in_room: ([monster]) =>
    `Monster not in room: ${valueText(monster)}`,
  can_buy_item: ([item, quantity]) =>
    `Can buy item: ${valueText(item)}${quantity ? ` x${valueText(quantity)}` : ""}`,

  army_start: ([configName]) => `Start army: ${valueText(configName)}`,
  army_sync: ([label]) => `Army sync${label ? `: ${valueText(label)}` : ""}`,
  army_join: ([map, cell, pad]) =>
    `Army join: ${valueText(map)}${bracket(cellPadText(cell, pad))}`,
  army_kill: ([target]) => `Army kill: ${valueText(target)}`,
  army_kill_for: ([target, item, quantity, isTemp]) =>
    `Army kill for ${isTemp ? "temp item" : "item"}: [${valueText(target)}] [x${valueText(quantity)} ${valueText(item)}]`,
  army_kill_for_item: ([target, item, quantity]) =>
    `Army kill for item: [${valueText(target)}] [x${valueText(quantity)} ${valueText(item)}]`,
  army_kill_for_tempitem: ([target, item, quantity]) =>
    `Army kill for temp item: [${valueText(target)}] [x${valueText(quantity)} ${valueText(item)}]`,
  execute_with_army: ([, fnName]) =>
    `Execute with army${fnName ? `: ${valueText(fnName)}` : ""}`,
  army_equip_set: ([setName]) => `Army equip set: ${valueText(setName)}`,

  attack: ([target]) => `Attack: ${valueText(target)}`,
  cancel_target: () => "Cancel target",
  exit_combat: () => "Exit combat",
  kill: ([target]) => `Kill: ${valueText(target)}`,
  kill_for_item: ([target, item, quantity]) =>
    `Kill for item: [${valueText(target)}] [x${valueText(quantity)} ${valueText(item)}]`,
  kill_for_tempitem: ([target, item, quantity]) =>
    `Kill for temp item: [${valueText(target)}] [x${valueText(quantity)} ${valueText(item)}]`,
  rest: ([full]) => (full ? "Rest until full" : "Rest"),
  use_skill: ([skill]) => `Use skill: ${valueText(skill)}`,
  force_use_skill: ([skill]) => `Force use skill: ${valueText(skill)}`,
  hunt: ([target]) => `Hunt: ${valueText(target)}`,
  buff: ([skills]) =>
    Array.isArray(skills) && skills.length > 0
      ? `Buff: ${skills.map(valueText).join(", ")}`
      : "Buff",

  buy_item: ([shopId, item, quantity]) =>
    `Buy item: ${valueText(item)} x${valueText(quantity)} [shop ${valueText(shopId)}]`,
  deposit: ([item]) => `Deposit: ${valueText(item)}`,
  get_map_item: ([itemId]) => `Get map item: ${valueText(itemId)}`,
  pickup: ([item]) => `Pickup: ${valueText(item)}`,
  reject: ([item]) => `Reject: ${valueText(item)}`,
  sell_item: ([item]) => `Sell item: ${valueText(item)}`,
  swap: ([bankItem, invItem]) =>
    `Swap: ${valueText(bankItem)} -> ${valueText(invItem)}`,
  withdraw: ([item]) => `Withdraw: ${valueText(item)}`,
  equip_item: ([item]) => `Equip item: ${valueText(item)}`,
  equip_item_by_enhancement: ([options]) =>
    `Equip item by enhancement: ${optionText(options, "enhancement") ?? ""}${bracket(optionText(options, "special") ?? optionText(options, "slot"))}`,
  load_shop: ([shopId]) => `Load shop: ${valueText(shopId)}`,
  enhance_item: ([item, options]) =>
    `Enhance item: ${valueText(item)} [${optionText(options, "enhancement") ?? ""}${optionText(options, "special") ? `:${optionText(options, "special")}` : ""}]`,

  join_map: ([map, cell, pad]) =>
    `Join map: ${valueText(map)}${bracket(cellPadText(cell, pad))}`,
  join: ([map, cell, pad]) =>
    `Join map: ${valueText(map)}${bracket(cellPadText(cell, pad))}`,
  move_to_cell: ([cell, pad]) =>
    `Move to cell: ${valueText(cell)}${bracket(valueText(pad) || undefined)}`,
  jump_to_cell: ([cell, pad]) =>
    `Move to cell: ${valueText(cell)}${bracket(valueText(pad) || undefined)}`,
  jump: ([cell, pad]) =>
    `Move to cell: ${valueText(cell)}${bracket(valueText(pad) || undefined)}`,
  walk_to: ([x, y]) => `Walk to: ${valueText(x)}, ${valueText(y)}`,
  goto_player: ([player]) => `Goto player: ${valueText(player)}`,
  goto_house: ([player]) =>
    player ? `Goto house: ${valueText(player)}` : "Goto house",
  set_spawnpoint: ([cell, pad]) =>
    `Set spawnpoint${bracket(cellPadText(cell, pad))}`,
  set_spawn: ([cell, pad]) =>
    `Set spawnpoint${bracket(cellPadText(cell, pad))}`,

  accept_quest: ([questId]) => `Accept quest: ${valueText(questId)}`,
  abandon_quest: ([questId]) => `Abandon quest: ${valueText(questId)}`,
  complete_quest: ([questId, options]) =>
    `Complete quest: ${valueText(questId)}${optionText(options, "itemId") ? ` [reward ${optionText(options, "itemId")}]` : ""}`,

  delay: ([ms]) => `Delay: ${valueText(ms)}ms`,
  log: ([message]) => `Log: ${valueText(message)}`,
  logout: () => "Logout",
  set_delay: ([ms]) => `Set delay: ${valueText(ms)}ms`,
  set_fps: ([fps]) => `Set FPS: ${valueText(fps)}`,
  enable_collisions: () => "Enable collisions",
  disable_collisions: () => "Disable collisions",
  enable_effects: () => "Enable effects",
  disable_effects: () => "Disable effects",
  show_death_ads: () => "Show death ads",
  hide_death_ads: () => "Hide death ads",
  enable_enemy_magnet: () => "Enable enemy magnet",
  disable_enemy_magnet: () => "Disable enemy magnet",
  enable_infinite_range: () => "Enable infinite range",
  disable_infinite_range: () => "Disable infinite range",
  enable_lag_killer: () => "Enable lag killer",
  disable_lag_killer: () => "Disable lag killer",
  enable_provoke_cell: () => "Enable provoke cell",
  disable_provoke_cell: () => "Disable provoke cell",
  enable_skip_cutscenes: () => "Enable skip cutscenes",
  disable_skip_cutscenes: () => "Disable skip cutscenes",
  hide_players: () => "Hide players",
  show_players: () => "Show players",
  set_walk_speed: ([speed]) => `Set walk speed: ${valueText(speed)}`,
  wait_for_player_count: ([count, exact]) =>
    `Wait for player count: ${exact ? "exactly " : ""}${valueText(count)}`,
  set_name: ([name]) => `Set name: ${valueText(name)}`,
  set_guild: ([guild]) => `Set guild: ${valueText(guild)}`,
  buy_lifesteal: ([quantity]) => `Buy Scroll of Life Steal: ${valueText(quantity)}`,
  buy_scroll_of_enrage: ([quantity]) =>
    `Buy Scroll of Enrage: ${valueText(quantity)}`,
  register_handler: ([type, name]) =>
    `Register handler: ${valueText(type)}:${valueText(name)}`,
  unregister_handler: ([type, name]) =>
    `Unregister handler: ${valueText(type)}:${valueText(name)}`,
  register_command: ([name]) => `Register command: ${valueText(name)}`,
  unregister_command: ([name]) => `Unregister command: ${valueText(name)}`,
  register_condition: ([name]) => `Register condition: ${valueText(name)}`,
  unregister_condition: ([name]) => `Unregister condition: ${valueText(name)}`,
  use_autozone_ledgermayne: () => "Set auto zone: LedgerMayne",
  use_autozone_moreskulls: () => "Set auto zone: More Skulls",
  use_autozone_darkcarnax: () => "Set auto zone: Dark Carnax",
  use_autozone_ultradage: () => "Set auto zone: Ultra Dage",
  use_autozone_astralshrine: () => "Set auto zone: Astral Shrine",
  use_autozone_queeniona: () => "Set auto zone: Queen Iona",
  use_autozone_magnumopus: () => "Set auto zone: Magnum Opus",
  use_autorelogin: () => "Enable auto relogin",
  disable_autorelogin: () => "Disable auto relogin",
  close_window: () => "Close window",
  beep: ([times]) => `Beep: ${valueText(times)}`,
  register_task: ([name]) => `Register task: ${valueText(name)}`,
  unregister_task: ([name]) => `Unregister task: ${valueText(name)}`,
  use_consumables: ([items, equipAfter]) =>
    `Use consumables: ${valueText(items)}${equipAfter ? ` -> ${valueText(equipAfter)}` : ""}`,
  do_wheelofdoom: ([toBank]) =>
    `Do Wheel of Doom${toBank ? ": bank rewards" : ""}`,
  label: ([label]) => `Label: ${valueText(label)}`,
  goto_label: ([label]) => `Goto label: ${valueText(label)}`,
  stop: () => "Stop bot",
  stop_bot: () => "Stop bot",

  if: ([condition]) => `If: ${formatCondition(condition)}`,
  if_all: (conditions) => `If all: ${conditions.map(formatCondition).join(", ")}`,
  if_any: (conditions) => `If any: ${conditions.map(formatCondition).join(" || ")}`,
  else: () => "Else",
  end_if: () => "End if",
} satisfies Record<ScriptCommandName, CommandDisplayFormatter>;

const formatCommandLabel = (instruction: ScriptInstruction): string => {
  if (instruction.name in commandDisplayFormatters) {
    const formatter =
      commandDisplayFormatters[instruction.name as ScriptCommandName];
    return truncate(formatter(instruction.args), MAX_LABEL_LENGTH);
  }

  const argsText = formatInstructionArgs(instruction.args);
  return argsText
    ? `${instruction.name.replaceAll("_", " ")}: ${argsText}`
    : instruction.name.replaceAll("_", " ");
};

export const toScriptCommandDisplayItem = (
  instruction: ScriptInstruction,
): ScriptCommandDisplayItem => ({
  index: instruction.index,
  name: instruction.name,
  label: formatCommandLabel(instruction),
  argsText: formatInstructionArgs(instruction.args),
});

export const toScriptCommandDisplayItems = (
  instructions: ReadonlyArray<ScriptInstruction>,
): readonly ScriptCommandDisplayItem[] =>
  instructions.map(toScriptCommandDisplayItem);
