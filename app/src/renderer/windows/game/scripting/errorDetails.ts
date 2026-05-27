import { Cause } from "effect";

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 8;
const MAX_OBJECT_KEYS = 12;
const MAX_DEPTH = 3;

const truncateString = (value: string): string =>
  value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...`
    : value;

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null;

const isErrorLike = (
  value: unknown,
): value is {
  readonly name?: unknown;
  readonly message?: unknown;
  readonly stack?: unknown;
} => isRecord(value) && ("message" in value || "stack" in value);

const summarizeUnknown = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (typeof value === "symbol" || typeof value === "function") {
    return String(value);
  }

  if (!isRecord(value)) {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth >= MAX_DEPTH) {
    return Object.prototype.toString.call(value);
  }

  seen.add(value);

  if (Cause.isCause(value)) {
    return {
      tag: "Cause",
      reasons: value.reasons.map((reason) =>
        Cause.isFailReason(reason)
          ? {
              tag: "Fail",
              error: summarizeUnknown(reason.error, depth + 1, seen),
            }
          : Cause.isDieReason(reason)
            ? {
                tag: "Die",
                defect: summarizeUnknown(reason.defect, depth + 1, seen),
              }
            : { tag: "Interrupt", fiberId: String(reason.fiberId) },
      ),
    };
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => summarizeUnknown(item, depth + 1, seen));
  }

  if (isErrorLike(value)) {
    const details: Record<string, unknown> = {};
    const tag = Reflect.get(value, "_tag");
    const method = Reflect.get(value, "method");
    const args = Reflect.get(value, "args");
    const cause = Reflect.get(value, "cause");

    if (typeof tag === "string") details["tag"] = tag;
    if (typeof value.name === "string") details["name"] = value.name;
    if (typeof value.message === "string") {
      details["message"] = truncateString(value.message);
    }
    if (typeof method === "string") details["method"] = method;
    if (args !== undefined) {
      details["args"] = summarizeUnknown(args, depth + 1, seen);
    }
    if (cause !== undefined) {
      details["cause"] = summarizeUnknown(cause, depth + 1, seen);
    }
    if (typeof value.stack === "string") {
      details["stack"] = truncateString(value.stack);
    }

    return details;
  }

  const details: Record<string, unknown> = {};
  const keys = Reflect.ownKeys(value).slice(0, MAX_OBJECT_KEYS);
  for (const key of keys) {
    if (typeof key !== "string") {
      continue;
    }

    details[key] = summarizeUnknown(Reflect.get(value, key), depth + 1, seen);
  }

  return details;
};

export const toDiagnosticDetails = (
  value: unknown,
): Readonly<Record<string, unknown>> => {
  const details = summarizeUnknown(value, 0, new WeakSet());
  return isRecord(details) ? details : { value: details };
};

export const toErrorMessage = (value: unknown): string => {
  if (value instanceof Error && value.message !== "") {
    return value.message;
  }

  if (isRecord(value)) {
    const tag = Reflect.get(value, "_tag");
    const method = Reflect.get(value, "method");
    if (typeof tag === "string" && typeof method === "string") {
      return `${tag}: ${method}`;
    }

    const message = Reflect.get(value, "message");
    if (typeof message === "string" && message !== "") {
      return message;
    }
  }

  return String(value);
};
