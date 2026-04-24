import { Effect } from "effect";
import type { ScriptCommandHandler } from "../Types";
import {
  recordScriptInstruction,
  requireScriptArgumentString,
  requireInstructionString,
  createCommandHandler,
  type ScriptInstructionRecorder,
} from "./commandDsl";

const equipItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionString(
      context,
      "equip_item",
      args,
      0,
      "item",
    );
    yield* context.run(context.bridge.call("inventory.equip", [item]));
  }),
);

export const itemCommandHandlers: ReadonlyArray<
  readonly [string, ScriptCommandHandler]
> = [["equip_item", equipItemCommand]];

export const createItemScriptDsl = (emit: ScriptInstructionRecorder) => ({
  /**
   * Equips an inventory item.
   *
   * @param item Item name.
   */
  equip_item(item: string) {
    recordScriptInstruction(
      emit,
      "equip_item",
      requireScriptArgumentString("equip_item", "item", item),
    );
  },
});
