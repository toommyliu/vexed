import type { ScriptInstruction } from "./Types";

const MAX_VALUE_LENGTH = 72;
const MAX_ARGS_LENGTH = 120;

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

export const toScriptCommandDisplayItem = (
  instruction: ScriptInstruction,
): ScriptCommandDisplayItem => ({
  index: instruction.index,
  name: instruction.name,
  label: instruction.name.replaceAll("_", " "),
  argsText: formatInstructionArgs(instruction.args),
});

export const toScriptCommandDisplayItems = (
  instructions: ReadonlyArray<ScriptInstruction>,
): readonly ScriptCommandDisplayItem[] =>
  instructions.map(toScriptCommandDisplayItem);
