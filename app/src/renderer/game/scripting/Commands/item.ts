import { Effect } from "effect";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  requireInstructionString,
  requireScriptArgumentString,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";

type ItemScriptCommandArguments = {
  equip_item: [item: string];
};

type ItemScriptDsl = ScriptCommandDsl<ItemScriptCommandArguments>;
const itemCommandDomain =
  defineScriptCommandDomain<ItemScriptCommandArguments>();

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

const itemCommandHandlerMap = itemCommandDomain.defineHandlers({
  equip_item: equipItemCommand,
});

export const itemCommandHandlers = itemCommandDomain.handlerEntries(
  itemCommandHandlerMap,
);

export const createItemScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): ItemScriptDsl => {
  const recordItemInstruction =
    itemCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    /**
     * Equips an inventory item.
     *
     * @param item Item name.
     */
    equip_item(item: string) {
      recordItemInstruction(
        "equip_item",
        requireScriptArgumentString("equip_item", "item", item),
      );
    },
  };
};
