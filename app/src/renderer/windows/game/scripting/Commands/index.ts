import type { ScriptCommandHandler } from "../Types";
import { armyCommandHandlers, createArmyScriptDsl } from "./army";
import { combatCommandHandlers, createCombatScriptDsl } from "./combat";
import {
  conditionCommandHandlers,
  createConditionScriptDsl,
} from "./conditions";
import { createItemScriptDsl, itemCommandHandlers } from "./item";
import { createMapScriptDsl, mapCommandHandlers } from "./map";
import { createMiscScriptDsl, miscCommandHandlers } from "./misc";
import { createQuestScriptDsl, questCommandHandlers } from "./quest";
import type { ScriptInstructionRecorder, ScriptCommandApi } from "./commandDsl";

export const createScriptDsl = (
  emit: ScriptInstructionRecorder,
): ScriptCommandApi => ({
  ...createConditionScriptDsl(emit),
  ...createArmyScriptDsl(emit),
  ...createCombatScriptDsl(emit),
  ...createItemScriptDsl(emit),
  ...createMapScriptDsl(emit),
  ...createMiscScriptDsl(emit),
  ...createQuestScriptDsl(emit),
});

export const scriptCommandHandlers = [
  ...conditionCommandHandlers,
  ...armyCommandHandlers,
  ...combatCommandHandlers,
  ...itemCommandHandlers,
  ...mapCommandHandlers,
  ...miscCommandHandlers,
  ...questCommandHandlers,
] satisfies ReadonlyArray<readonly [string, ScriptCommandHandler]>;

export type ScriptCommandName = (typeof scriptCommandHandlers)[number][0];
