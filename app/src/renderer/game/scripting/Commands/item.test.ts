import { expect, test } from "vitest";
import { createScriptDsl } from ".";

type RecordedInstruction = {
  readonly name: string;
  readonly args: ReadonlyArray<unknown>;
};

type ItemCommandMap = Record<string, (...args: unknown[]) => unknown> & {
  equip_item_by_enhancement(options: unknown): unknown;
};

const createRecordedCommandMap = () => {
  const instructions: RecordedInstruction[] = [];
  const cmd = createScriptDsl((name, args) => {
    instructions.push({ name, args: [...args] });
  }) as ItemCommandMap;

  return { cmd, instructions };
};

test("records equip_item_by_enhancement object selectors", () => {
  const { cmd, instructions } = createRecordedCommandMap();

  cmd.equip_item_by_enhancement({ enhancement: "forge", slot: "helm" });

  expect(instructions).toEqual([
    {
      args: [{ enhancement: "forge", slot: "helm" }],
      name: "equip_item_by_enhancement",
    },
  ]);
});

test("rejects non-object equip_item_by_enhancement selectors", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.equip_item_by_enhancement("forge")).toThrow(
    "cmd.equip_item_by_enhancement: options must be an object",
  );
});

test("rejects missing or empty equip_item_by_enhancement enhancement", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.equip_item_by_enhancement({ slot: "helm" })).toThrow(
    "cmd.equip_item_by_enhancement: options.enhancement must be a non-empty string",
  );
  expect(() =>
    cmd.equip_item_by_enhancement({ enhancement: "", slot: "helm" }),
  ).toThrow(
    "cmd.equip_item_by_enhancement: options.enhancement must be a non-empty string",
  );
});
