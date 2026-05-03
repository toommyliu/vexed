import { expect, test } from "vitest";
import { createScriptDsl } from ".";

type RecordedInstruction = {
  readonly name: string;
  readonly args: ReadonlyArray<unknown>;
};

type ItemCommandMap = Record<string, (...args: unknown[]) => unknown> & {
  enhance_item(item: unknown, options?: unknown): unknown;
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

test("records enhance_item object options", () => {
  const { cmd, instructions } = createRecordedCommandMap();

  cmd.enhance_item("Sword", {
    enhancement: "forge",
    special: "val",
  });

  expect(instructions).toEqual([
    {
      args: ["Sword", { enhancement: "forge", special: "val" }],
      name: "enhance_item",
    },
  ]);
});

test("records enhance_item object options without special", () => {
  const { cmd, instructions } = createRecordedCommandMap();

  cmd.enhance_item("Sword", { enhancement: "Wizard" });

  expect(instructions).toEqual([
    {
      args: ["Sword", { enhancement: "Wizard" }],
      name: "enhance_item",
    },
  ]);
});

test("rejects old object-only enhance_item options", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() =>
    cmd.enhance_item({ enhancement: "Wizard", item: "Sword" }),
  ).toThrow("cmd.enhance_item: item must be a non-empty string");
});

test("rejects missing or empty enhance_item item", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.enhance_item("", { enhancement: "Wizard" })).toThrow(
    "cmd.enhance_item: item must be a non-empty string",
  );
});

test("rejects missing enhance_item options", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.enhance_item("Sword")).toThrow(
    "cmd.enhance_item: options must be an object",
  );
});

test("rejects missing or empty enhance_item enhancement", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.enhance_item("Sword", {})).toThrow(
    "cmd.enhance_item: options.enhancement must be a non-empty string",
  );
  expect(() => cmd.enhance_item("Sword", { enhancement: "" })).toThrow(
    "cmd.enhance_item: options.enhancement must be a non-empty string",
  );
});

test("rejects empty enhance_item special", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() =>
    cmd.enhance_item("Sword", { enhancement: "Wizard", special: "" }),
  ).toThrow("cmd.enhance_item: options.special must be a non-empty string");
});
